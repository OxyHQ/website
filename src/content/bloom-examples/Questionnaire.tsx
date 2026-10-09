import { Questionnaire } from '@oxy.so/bloom/questionnaire'

export default function QuestionnaireExample() {
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><Questionnaire questions={[{id:"goal",question:"What would you like to create?",options:[{value:"site",label:"A website"},{value:"app",label:"An app"},{value:"idea",label:"Explore an idea"}]}]} /></div>)
}
