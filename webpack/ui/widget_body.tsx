import * as React from "react";
import { JSXChildren } from "../util";

interface WidgetBodyProps {
  children?: JSXChildren;
}

export function WidgetBody(props: WidgetBodyProps) {
  return <div className="widget-body">
    {props.children}
  </div>;
}
