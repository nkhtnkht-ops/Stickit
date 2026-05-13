import { TaskList } from "@/components/tasks/TaskList";
import { tomorrowRange } from "@/utils/dateRange";

export default function Tomorrow() {
  return <TaskList title="明日" filter={tomorrowRange()} />;
}
