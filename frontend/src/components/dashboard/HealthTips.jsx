import { HeartPulse } from "lucide-react";

function HealthTips(){

return(

<div className="bg-white rounded-2xl shadow-md p-6">

<div className="flex items-center gap-2 mb-4">

<HeartPulse
className="text-red-500"
/>

<h2 className="text-xl font-bold">

Health Tips

</h2>

</div>

<ul className="space-y-3 text-gray-600">

<li>

💧 Drink at least 2 litres of water.

</li>

<li>

🥗 Take medicines after food if prescribed.

</li>

<li>

😴 Sleep at least 8 hours.

</li>

<li>

🚶 Walk for 30 minutes every day.

</li>

</ul>

</div>

);

}

export default HealthTips;