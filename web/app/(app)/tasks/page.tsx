import { getTasks, getBranches, getPositions, getStaff } from "@/lib/api-server";
import TasksBoard from "@/components/tasks/TasksBoard";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Görevler | Shift",
};

export default async function TasksPage() {
  // Demo amaçlı ilk şubeyi alıyoruz
  const branches = await getBranches();
  if (branches.length === 0) {
    return <div className="p-4 text-rose-500">Önce bir şube eklemelisiniz.</div>;
  }
  
  const branch = branches[0];

  // Verileri paralel çek
  const [tasks, positions, staff] = await Promise.all([
    getTasks(branch.id),
    getPositions(),
    getStaff()
  ]);

  return (
    <TasksBoard 
      initialTasks={tasks} 
      branch={branch} 
      positions={positions} 
      staff={staff} 
    />
  );
}
