import TaskBoardPage from "@/components/task-board/TaskBoardPage";

export default function AdminTasks(props) {
    return <TaskBoardPage department="admin" {...props} />;
}
