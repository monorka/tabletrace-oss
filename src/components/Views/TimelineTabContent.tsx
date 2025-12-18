/**
 * Timeline Tab Content Component - wraps TimelineView
 */

import { TimelineView } from "./TimelineView";
import { TimelineViewProps } from "../../types";

export function TimelineTabContent(props: TimelineViewProps) {
  return <TimelineView {...props} />;
}

