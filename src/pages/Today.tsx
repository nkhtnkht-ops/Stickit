import { TaskList } from "@/components/tasks/TaskList";
import { todayRange } from "@/utils/dateRange";

export default function Today() {
  const today = new Date();
  const dow = ["日", "月", "火", "水", "木", "金", "土"][today.getDay()];
  return <TaskList title="今日" subtitle={`${today.getMonth() + 1}月${today.getDate()}日 ${dow}曜日`} filter={todayRange()} />;
}
