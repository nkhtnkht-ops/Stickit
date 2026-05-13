import { TaskList } from "@/components/tasks/TaskList";
import { next7DaysRange } from "@/utils/dateRange";

export default function Next7Days() {
  return <TaskList title="今後7日間" filter={next7DaysRange()} />;
}
