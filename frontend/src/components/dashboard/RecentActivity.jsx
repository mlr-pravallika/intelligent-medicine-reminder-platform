import { Bell } from "lucide-react";

function RecentActivity() {

const activities=[

{
title:"Email Reminder Sent",
time:"08:00 AM"
},

{
title:"SMS Reminder Delivered",
time:"08:00 AM"
},

{
title:"Paracetamol Taken",
time:"08:15 AM"
},

{
title:"Vitamin D Scheduled",
time:"01:00 PM"
}

];

return(

<div className="bg-white rounded-2xl shadow-md p-6">

<div className="flex items-center gap-2 mb-5">

<Bell
className="text-blue-600"
/>

<h2 className="text-xl font-bold">

Recent Activity

</h2>

</div>

<div className="space-y-4">

{

activities.map((activity,index)=>(

<div
key={index}
className="border-b pb-3"
>

<h3 className="font-semibold">

{activity.title}

</h3>

<p className="text-gray-500 text-sm">

{activity.time}

</p>

</div>

))

}

</div>

</div>

);

}

export default RecentActivity;