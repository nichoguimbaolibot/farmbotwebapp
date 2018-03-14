# Keeps track of JSON Web Tokens that have been revoked prior to their
# expiration date.
class TokenExpiration < ApplicationRecord
  def broadcast?
    false
  end
end
