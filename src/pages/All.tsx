import { TaskList } from "@/components/tasks/TaskList";

export default function All() {
  return <TaskList title="すべて" filter={{ status: "all" }} />;
}
