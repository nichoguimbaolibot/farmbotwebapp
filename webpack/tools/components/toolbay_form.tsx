import * as React from "react";
import { ToolBayFormProps } from "../interfaces";
import {
  Widget,
  WidgetBody,
  WidgetHeader,
  Col,
  Row,
  BlurableInput,
  SaveBtn,
  FBSelect
} from "../../ui/index";
import { t } from "i18next";
import {
  TaggedToolSlotPointer, getArrayStatus, SpecialStatus
} from "../../resources/tagged_resources";
import { edit, destroy, saveAll, init } from "../../api/crud";
import { ToolBayHeader } from "./toolbay_header";
import { ToolTips } from "../../constants";
import * as _ from "lodash";
import { BotPosition } from "../../devices/interfaces";

export class ToolBayForm extends React.Component<ToolBayFormProps, {}> {

  emptyToolSlot = (): TaggedToolSlotPointer => {
    return {
      uuid: "ERROR: GENERATED BY REDUCER - SHOULD BE UNSEEN",
      kind: "Point",
      specialStatus: SpecialStatus.SAVED,
      body: {
        x: 0,
        y: 0,
        z: 0,
        radius: 25,
        pointer_type: "ToolSlot",
        meta: {},
        tool_id: undefined,
        name: "Tool Slot"
      }
    };
  }

  positionIsDefined = (position: BotPosition): boolean => {
    return _.isNumber(position.x) && _.isNumber(position.y) && _.isNumber(position.z);
  }

  useCurrentPosition = (dispatch: Function, slot: TaggedToolSlotPointer, position: BotPosition) => {
    if (this.positionIsDefined(position)) {
      dispatch(edit(slot, { x: position.x, y: position.y, z: position.z }));
    }
  };

  positionButtonTitle = (position: BotPosition): string => {
    if (this.positionIsDefined(position)) {
      return `use current location (${position.x}, ${position.y}, ${position.z})`;
    } else {
      return "use current location (unknown)";
    }
  }

  render() {
    const { toggle, dispatch, toolSlots, botPosition } = this.props;

    const toolSlotStatus = getArrayStatus(toolSlots);
    return <div>
      <Widget>
        <WidgetHeader helpText={ToolTips.TOOLBAY_LIST} title="Tool Slots">
          <button
            className="gray fb-button"
            hidden={!!toolSlotStatus}
            onClick={() => { toggle(); }}>
            {t("Back")}
          </button>
          <SaveBtn
            status={toolSlotStatus}
            onClick={() => {
              dispatch(saveAll(toolSlots, () => { toggle(); }));
            }} />
          <button
            className="green fb-button"
            onClick={() => { dispatch(init(this.emptyToolSlot())); }}>
            <i className="fa fa-plus" />
          </button>
        </WidgetHeader>
        <WidgetBody>
          <ToolBayHeader />
          {this.props.getToolSlots().map(
            (slot: TaggedToolSlotPointer, index: number) => {
              return <Row key={index}>
                <Col xs={2}>
                  <label>{index + 1}</label>
                  <button
                    className="blue fb-button"
                    title={this.positionButtonTitle(botPosition)}
                    onClick={() => this.useCurrentPosition(dispatch, slot, botPosition)}>
                    <i className="fa fa-crosshairs" />
                  </button>
                </Col>
                <Col xs={2}>
                  <BlurableInput
                    value={(slot.body.x || 0).toString()}
                    onCommit={(e) => {
                      dispatch(edit(slot, { x: parseInt(e.currentTarget.value, 10) }));
                    }}
                    type="number" />
                </Col>
                <Col xs={2}>
                  <BlurableInput
                    value={(slot.body.y || 0).toString()}
                    onCommit={(e) => {
                      dispatch(edit(slot, { y: parseInt(e.currentTarget.value, 10) }));
                    }}
                    type="number" />
                </Col>
                <Col xs={2}>
                  <BlurableInput
                    value={(slot.body.z || 0).toString()}
                    onCommit={(e) => {
                      dispatch(edit(slot, { z: parseInt(e.currentTarget.value, 10) }));
                    }}
                    type="number" />
                </Col>
                <Col xs={3}>
                  <FBSelect
                    list={this.props.getToolOptions()}
                    selectedItem={this.props.getChosenToolOption(slot.uuid)}
                    allowEmpty={true}
                    onChange={this.props.changeToolSlot(slot,
                      this.props.dispatch)} />
                </Col>
                <Col xs={1}>
                  <button
                    className="red fb-button"
                    onClick={() => dispatch(destroy(slot.uuid))}>
                    <i className="fa fa-times" />
                  </button>
                </Col>
              </Row>;
            })}
        </WidgetBody>
      </Widget>
    </div>;
  }
}
