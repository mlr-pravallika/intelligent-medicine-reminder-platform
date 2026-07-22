import {
Server,
Database,
Mail,
Smartphone,
Timer
} from "lucide-react";

function NotificationStatus() {

const services = [

{
name:"Backend",
icon:<Server size={20}/>,
status:"Online"
},

{
name:"Database",
icon:<Database size={20}/>,
status:"Connected"
},

{
name:"Scheduler",
icon:<Timer size={20}/>,
status:"Running"
},

{
name:"Email",
icon:<Mail size={20}/>,
status:"Connected"
},

{
name:"SMS",
icon:<Smartphone size={20}/>,
status:"Connected"
}

];

return(

<div className="bg-white rounded-2xl shadow-md p-6">

<h2 className="text-xl font-bold mb-5">
System Status
</h2>

<div className="space-y-4">

{
services.map((service,index)=>(

<div
key={index}
className="flex justify-between items-center"
>

<div className="flex items-center gap-3">

{service.icon}

<span>{service.name}</span>

</div>

<span className="text-green-600 font-semibold">

🟢 {service.status}

</span>

</div>

))
}

</div>

</div>

);

}

export default NotificationStatus;