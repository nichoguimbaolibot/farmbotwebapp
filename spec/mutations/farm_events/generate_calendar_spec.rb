require 'spec_helper'

describe FarmEvents::GenerateCalendar do
  it 'Builds a list of dates' do
    start  = Time.now + 1.minute
    params = { origin:      start,
               lower_limit: start,
               upper_limit: start + 1.hours,
               repeat:      5,
               time_unit:   "minutely" }
    calendar = FarmEvents::GenerateCalendar.run!(params)
    expect(calendar.first).to eq(params[:origin])
    calendar.map { |date| expect(date).to be >= params[:origin] }
    calendar.map { |date| expect(date).to be <= params[:upper_limit] }
    expect(calendar.length).to eq(12)
  end

  it 'hit a bug in production' do
    start  = Time.now + 1.minute
    finish = start    + 5.days
    params   = { origin:      start,
                 lower_limit: start,
                 upper_limit: finish,
                 repeat:      1,
                 time_unit:   "daily" }
    calendar = FarmEvents::GenerateCalendar.run!(params)
    expect(calendar.first.day).to eq(start.day)
    expect(calendar.length).to be > 4
    expect(calendar.length).to be < 7
  end

  it 'has a known calendar bug' do
    tomorrow = (Time.now + 1.day).midnight
    ten_am   = tomorrow + 10.hours
    calendar = FarmEvents::GenerateCalendar.run!("origin"      => tomorrow,
                                                 "lower_limit" => tomorrow,
                                                 "upper_limit" => ten_am,
                                                 "repeat"      => 2,
                                                 "time_unit"   => "hourly")
    expect(calendar.length).to be > 3
    expect(calendar.length).to be < 7
  end

  it 'hit more bugs' do
    tomorrow = Time.now + 1.day
    calendar = FarmEvents::GenerateCalendar.run!("origin"      => tomorrow,
                                                 "lower_limit" => tomorrow,
                                                 "upper_limit" => tomorrow + 5.minutes,
                                                 "repeat"      => 1,
                                                 "time_unit"   => "minutely")
    expect(calendar.length).to be > 3
    expect(calendar.length).to be < 7
  end

  it 'schedules one-off events: origin < lower_limit outside of grace period' do
    params   = { origin:      Time.now - 6.minutes,
                 lower_limit: Time.now,
                 upper_limit: nil,
                 repeat:      1,
                 time_unit:   FarmEvent::NEVER }
    calendar = FarmEvents::GenerateCalendar.run!(params)
    expect(calendar.length).to eq(0)
  end

  it 'schedules one-off events: origin < lower_limit within grace period' do
    params   = { origin:      Time.now - 2.minutes,
                 lower_limit: Time.now,
                 upper_limit: nil,
                 repeat:      1,
                 time_unit:   FarmEvent::NEVER }
    calendar = FarmEvents::GenerateCalendar.run!(params)
    expect(calendar.length).to eq(1)
  end

    it 'schedules one-off events: origin = lower_limit' do
    tomorrow = Time.now + 1.day
    params   = { origin:      tomorrow,
                 lower_limit: tomorrow,
                 upper_limit: nil,
                 repeat:      1,
                 time_unit:   FarmEvent::NEVER }
    calendar = FarmEvents::GenerateCalendar.run!(params)
    expect(calendar.length).to eq(1)
    expect(calendar.first).to eq(params[:origin])
  end

    it 'schedules one-off events: origin > lower_limit' do
    params   = { origin:      Time.now + 1.day,
                 lower_limit: Time.now - 1.day,
                 upper_limit: nil,
                 repeat:      1,
                 time_unit:   FarmEvent::NEVER }
    calendar = FarmEvents::GenerateCalendar.run!(params)
    expect(calendar.length).to eq(1)
    expect(calendar.first).to eq(params[:origin])
  end

  idea = ->(start, interval_sec, lower, upper = (Time.now + 1.year)) {
    # How many items must we skip to get to the first occurence?
    skip_intervals    = ((lower - start) / interval_sec).ceil
    # At what time does the first event occur?
    first_item        = start + (skip_intervals * interval_sec).seconds
    list = [first_item]
    60.times do
      item = list.last + interval_sec.seconds
      list.push(item) unless item > upper
    end
    return list
  }

  it 'trys new idea' do
    monday   = (Time.now - 14.days).monday.midnight + 8.hours # 8am Monday
    tuesday  = monday + 19.hours                              # 3am Tuesday
    thursday = (monday + 3.days) + 10.hours                   # 18pm Thursday
    interval = 4 * FarmEvents::GenerateCalendar::TIME["hourly"]
    result1  = idea[monday, interval, tuesday, thursday]
    expect(result1[0].tuesday?).to be(true)
    expect(result1[0].hour).to be(4)
    expect(result1.length).to be(16)
  end
end
