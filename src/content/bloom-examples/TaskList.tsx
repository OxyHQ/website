import { TaskList } from '@oxy.so/bloom/task-list'

export default function TaskListExample() {
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><TaskList tasks={[{title:"Prepare your workspace",steps:[{label:"Create a project"},{label:"Invite your team"}]},{title:"Build your first idea",steps:[{label:"Choose components"}]}]} revealed={2} /></div>)
}
