import { useState } from "react";
import "./App.css";

function App() {
  const [userName, setUserName] = useState("Pravallika");

  const medicines = [
    {
      name: "Paracetamol",
      dosage: "500 mg",
      time: "8:00 PM",
      status: "Upcoming"
    },
    {
      name: "Vitamin D",
      dosage: "1000 IU",
      time: "9:00 AM",
      status: "Taken"
    },
    {
      name: "Amoxicillin",
      dosage: "250 mg",
      time: "1:00 PM",
      status: "Pending"
    }
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>MediTrack</h2>
        <p>Dashboard</p>
        <p>Medicines</p>
        <p>History</p>
        <p>Profile</p>
      </aside>

      <main className="content">
        <h1>Hello, {userName} 👋</h1>
        <p>Here is your medication summary for today.</p>

        <section className="cards">
          <div className="card">
            <h3>Today's Medicines</h3>
            <h2>3</h2>
          </div>

          <div className="card">
            <h3>Taken</h3>
            <h2>1</h2>
          </div>

          <div className="card">
            <h3>Missed</h3>
            <h2>0</h2>
          </div>

          <div className="card">
            <h3>Adherence</h3>
            <h2>100%</h2>
          </div>
        </section>

        <section className="medicine-section">
          <h2>Today's Schedule</h2>

          {medicines.map((medicine, index) => (
            <div className="medicine-card" key={index}>
              <div>
                <h3>{medicine.name}</h3>
                <p>{medicine.dosage}</p>
              </div>

              <div>
                <p>{medicine.time}</p>
                <span>{medicine.status}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="profile-section">
          <h2>Profile</h2>

          <input
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            placeholder="Enter your name"
          />

          <button onClick={() => alert("Profile saved successfully!")}>
            Save Profile
          </button>
        </section>
      </main>
    </div>
  );
}

export default App;