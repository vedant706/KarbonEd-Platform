import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { CarbonCalculator } from './components/Calculator.jsx';
import { jsPDF } from 'jspdf';

const generateCertificate = (transaction, user) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "in", format: "letter" });
    doc.setFillColor(244, 243, 237);
    doc.rect(0, 0, 11, 8.5, "F");
    doc.setDrawColor(26, 33, 21);
    doc.setLineWidth(0.1);
    doc.rect(0.5, 0.5, 10, 7.5);
    doc.setTextColor(26, 33, 21);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.text("Certificate of Carbon Offset", 5.5, 2, null, null, "center");
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("This certifies that", 5.5, 3, null, null, "center");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(59, 130, 102); 
    doc.text(user.name.toUpperCase(), 5.5, 3.8, null, null, "center");
    doc.setTextColor(26, 33, 21);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`has successfully offset`, 5.5, 4.5, null, null, "center");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(`${transaction.amountPurchased} Metric Tons of CO2`, 5.5, 5.2, null, null, "center");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`by supporting the verified project:`, 5.5, 5.9, null, null, "center");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`"${transaction.projectName}"`, 5.5, 6.5, null, null, "center");
    doc.setFontSize(10);
    doc.setTextColor(139, 147, 125); 
    const dateStr = new Date(transaction.purchaseDate).toLocaleDateString();
    doc.text(`Date of Issue: ${dateStr}`, 1, 7.5);
    doc.text(`Transaction ID: ${transaction._id}`, 6.5, 7.5);
    doc.text(`KarbonEd Educational Simulation`, 5.5, 7.5, null, null, "center");
    doc.save(`KarbonEd_Offset_${transaction._id.substring(0,6)}.pdf`);
};

export const AdminDashboard = ({ token, credits, setCredits }) => {
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => { fetchProjects(); }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/admin/projects', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) setProjects(data);
            else setError(data.error || 'Failed to fetch projects.');
        } catch (err) { setError('Failed to connect to the server.'); }
    };

    const verifyProject = async (projectId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/admin/projects/${projectId}/verify`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setProjects(projects.map(p => p._id === projectId ? { ...p, isVerified: true } : p));
                if (setCredits) setCredits(credits.map(p => p._id === projectId ? { ...p, isVerified: true } : p));
            }
        } catch (err) { console.error('Failed to verify:', err); }
    };

    const deleteProject = async (projectId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/credits/${projectId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const projectToDelete = projects.find(p => p._id === projectId);
                setProjects(projects.filter(p => p._id !== projectId));
                if (setCredits) setCredits(credits.filter(p => p._id !== projectId));
            }
        } catch (err) { console.error('Failed to delete:', err); }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10">
            <div className="mb-10">
                <span className="text-[#3B8266] text-xs font-bold tracking-[0.2em] uppercase mb-3 block">Security</span>
                <h2 className="text-4xl font-['Montenegrin_Gothic_One'] text-[#1A2115] mb-4 font-bold">Admin Verification Portal</h2>
                <p className="text-[#4A533E] font-light">Review 3rd-party verification codes and secure the marketplace.</p>
            </div>
            {error && <div className="bg-red-100 text-red-800 p-4 rounded-xl mb-6">{error}</div>}
            <div className="bg-white rounded-[2rem] shadow-xl border border-[#E5E4DE] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1A2115] text-[#F4F3ED] uppercase tracking-widest text-[10px] font-bold">
                                <th className="p-5">Project Name</th>
                                <th className="p-5">Company</th>
                                <th className="p-5">Capacity</th>
                                <th className="p-5">Registry Code</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-light text-[#1A2115]">
                            {projects.map((project) => (
                                <tr key={project._id} className={`border-b border-[#E5E4DE] transition-colors ${project.isVerified ? 'bg-white' : 'bg-[#F4F3ED]'}`}>
                                    <td className="p-5 font-medium">{project.projectName}</td>
                                    <td className="p-5">{project.companyName}</td>
                                    <td className="p-5">{project.offsetAmount} Tons</td>
                                    <td className="p-5"><code className="bg-[#E5E4DE] px-2 py-1 rounded text-xs">{project.thirdPartyVerificationCode}</code></td>
                                    <td className="p-5">
                                        {project.isVerified ? 
                                            <span className="text-green-700 font-bold text-xs uppercase tracking-wider">Verified</span> : 
                                            <span className="text-[#D4B985] font-bold text-xs uppercase tracking-wider">Pending</span>
                                        }
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-3">
                                            {!project.isVerified && (
                                                <button onClick={() => verifyProject(project._id)} className="bg-[#1A2115] hover:bg-[#2C3524] text-[#3B8266] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                                                    Approve
                                                </button>
                                            )}
                                            <button onClick={() => deleteProject(project._id)} className="border border-red-200 hover:bg-red-50 text-red-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

function Navbar({ user, setUser }) {
  return (
    <nav className="bg-[#1A2115] text-[#F4F3ED] py-4 px-6 md:px-10 flex flex-wrap justify-between items-center sticky top-0 z-50 shadow-xl border-b border-[#2C3524] gap-4">
      <div className="flex flex-wrap items-center gap-8">
        
        {/* KARBONED CUSTOM LOGOS */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {/* The SVG Logo - Changed to w-14 h-14 to make it bigger! */}
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-[#3B8266] shadow-lg p-1">
                <img src="/logo.svg" alt="KarbonEd Logo" className="w-full h-full object-contain" />
            </div>
            {/* The Stylized Text Name */}
            <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#3B8266] to-[#6DD58C] font-['Montenegrin_Gothic_One']">
                KARBON<span className="font-light text-[#F4F3ED]">ED</span>
            </span>
        </Link>

        <div className="flex flex-wrap items-center gap-6">
            {!user && (
              <>
                <a href="#about" className="text-[#8B937D] hover:text-[#6DD58C] text-xs uppercase tracking-widest font-semibold transition-colors">About</a>
                <a href="#education" className="text-[#8B937D] hover:text-[#6DD58C] text-xs uppercase tracking-widest font-semibold transition-colors">Learn</a>
                <a href="#benefits" className="text-[#8B937D] hover:text-[#6DD58C] text-xs uppercase tracking-widest font-semibold transition-colors">Benefits</a>
              </>
            )}
            
            {user?.role === 'buyer' && (
              <>
                <Link to="/marketplace" className="text-[#8B937D] hover:text-[#6DD58C] text-xs uppercase tracking-widest font-semibold transition-colors">Exchange</Link>
                <Link to="/wallet" className="text-[#8B937D] hover:text-[#6DD58C] text-xs uppercase tracking-widest font-semibold transition-colors">My Wallet</Link>
              </>
            )}
            
            {user?.role === 'seller' && (
              <Link to="/seller" className="text-[#8B937D] hover:text-[#6DD58C] text-xs uppercase tracking-widest font-semibold transition-colors">Developer Portal</Link>
            )}
            
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-[#8B937D] hover:text-[#6DD58C] text-xs uppercase tracking-widest font-semibold transition-colors">Admin Verification</Link>
            )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 ml-auto">
        {!user ? (
          <Link to="/login" className="bg-[#3B8266] hover:bg-[#4E9C7D] text-[#F4F3ED] px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-[#3B8266]/20">Access Portal</Link>
        ) : (
          <div className="flex items-center gap-6">
            <span className="text-[#8B937D] text-sm font-light">Welcome, <strong className="text-[#F4F3ED] font-medium">{user.name}</strong></span>
            <button onClick={() => setUser(null)} className="border border-[#4A533E] hover:bg-[#2C3524] text-[#8B937D] hover:text-[#F4F3ED] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function HomePage() {
    const [activeFlow, setActiveFlow] = useState('buyer');

    useEffect(() => {
        document.documentElement.style.scrollBehavior = 'smooth';
        return () => { document.documentElement.style.scrollBehavior = 'auto'; }
    }, []);

    return (
      <div className="bg-[#F4F3ED]">
        
        {/* HERO SECTION */}
        <div className="bg-[#1A2115] relative overflow-hidden py-32 px-6 text-center border-b border-[#2C3524]">
          <div className="absolute top-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-[#3B8266] opacity-10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto">
              <span className="text-[#6DD58C] text-xs font-bold tracking-[0.3em] uppercase mb-6 block">Democratizing Climate Finance Education</span>
              <h1 className="text-5xl md:text-7xl font-['Montenegrin_Gothic_One'] text-[#F4F3ED] mb-8 leading-tight font-bold">
                Learn to Balance Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B8266] to-[#6DD58C]">Impact on Earth.</span>
              </h1>
              <p className="text-[#8B937D] font-light text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
                KarbonEd is an interactive simulation platform built to teach everyday individuals how carbon markets work, and how green innovators fund the future.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link to="/login" className="bg-[#3B8266] text-[#F4F3ED] px-10 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#4E9C7D] shadow-xl shadow-[#3B8266]/20 transition-all hover:-translate-y-1">
                  Start The Simulation
                </Link>
                <a href="#about" className="border border-[#6DD58C] text-[#6DD58C] px-10 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#6DD58C]/10 transition-all">
                  Read Our Motive
                </a>
              </div>
          </div>
        </div>

        {/* ABOUT THE PLATFORM SECTION */}
        <div id="about" className="py-24 px-6 max-w-5xl mx-auto text-center border-b border-[#E5E4DE]">
            <span className="text-[#3B8266] text-xs font-bold tracking-[0.2em] uppercase mb-3 block">Our Motive</span>
            <h2 className="text-4xl md:text-5xl font-['Montenegrin_Gothic_One'] text-[#1A2115] mb-8 font-bold">Why We Built KarbonEd</h2>
            
            <p className="text-[#4A533E] font-light leading-relaxed mb-6 text-xl text-left md:text-center">
                For too long, the global carbon market has been a confusing mystery reserved for massive corporations and governments. Ordinary people are constantly told to "reduce their carbon footprint," but they are rarely taught <em>how</em> the underlying economics of climate action actually function.
            </p>
            <p className="text-[#4A533E] font-light leading-relaxed mb-8 text-xl text-left md:text-center">
                We created <strong>KarbonEd</strong> as a fully interactive, risk-free simulation platform. Our goal is to demystify climate finance. Whether you want to learn how your daily activities translate into Metric Tons of CO₂, or you want to understand how a small-scale solar farm monetizes its green impact by selling digital assets, this platform is your training ground.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#E5E4DE] hover:border-black transition-colors duration-300 cursor-default">
                    <span className="text-4xl block mb-4">🎓</span>
                    <h4 className="font-bold font-['Montenegrin_Gothic_One'] text-[#1A2115] mb-2 text-lg">100% Educational</h4>
                    <p className="text-base text-gray-700 font-medium leading-relaxed">A safe sandbox environment using simulated transactions to teach complex financial concepts.</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#E5E4DE] hover:border-black transition-colors duration-300 cursor-default">
                    <span className="text-4xl block mb-4">🤖</span>
                    <h4 className="font-bold font-['Montenegrin_Gothic_One'] text-[#1A2115] mb-2 text-lg">AI-Powered Matching</h4>
                    <p className="text-base text-gray-700 font-medium leading-relaxed">Experience how modern algorithms pair consumer budgets with the most efficient green projects.</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#E5E4DE] hover:border-black transition-colors duration-300 cursor-default">
                    <span className="text-4xl block mb-4">🌍</span>
                    <h4 className="font-bold font-['Montenegrin_Gothic_One'] text-[#1A2115] mb-2 text-lg">Empowering Action</h4>
                    <p className="text-base text-gray-700 font-medium leading-relaxed">By understanding the math behind emissions, you gain the power to make real-world changes.</p>
                </div>
            </div>
        </div>
  
        {/* EDUCATIONAL SECTION WITH FIXED PEXELS IMAGES */}
        <div id="education" className="py-24 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-20">
                <span className="text-[#3B8266] text-xs font-bold tracking-[0.2em] uppercase mb-3 block">The Science Explained</span>
                <h2 className="text-4xl md:text-5xl font-['Montenegrin_Gothic_One'] text-[#1A2115] mb-4 font-bold">Understanding the Basics</h2>
                <div className="w-24 h-1 bg-[#3B8266] mx-auto opacity-50 mt-6"></div>
            </div>
            
            <div className="space-y-32">
                {/* Concept 1: Footprint */}
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="w-full md:w-1/2">
                        <div className="rounded-[2rem] overflow-hidden shadow-2xl relative group">
                            <div className="absolute inset-0 bg-[#1A2115]/10 z-10 group-hover:bg-transparent transition-colors duration-500"></div>
                            <img src="https://images.pexels.com/photos/459728/pexels-photo-459728.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Industrial smoke representing emissions" className="w-full h-[600px] object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 md:pl-8">
                        <span className="text-5xl block mb-6">👣</span>
                        <h3 className="text-3xl md:text-5xl font-['Montenegrin_Gothic_One'] text-[#1A2115] mb-6 font-bold leading-tight">What exactly is a Carbon Footprint?</h3>
                        
                        <p className="text-[#4A533E] font-light leading-relaxed mb-5 text-lg">
                            Imagine walking with muddy shoes through a clean house. With every step you take, you leave a physical, dirty footprint behind. In our modern world, we leave an invisible trail too. Almost everything we do—like turning on the air conditioning, driving to work, streaming a movie, or even buying a manufactured product—requires energy.
                        </p>
                        <p className="text-[#4A533E] font-light leading-relaxed mb-5 text-lg">
                            Right now, most of the world's energy still comes from burning fossil fuels like coal, oil, and gas. When these fuels burn, they release invisible greenhouse gases (like Carbon Dioxide, or CO₂) into the sky. These gases act like a thick, heavy blanket wrapped around the Earth, trapping the sun's heat and causing the planet to slowly warm up.
                        </p>
                        <p className="text-[#4A533E] font-light leading-relaxed mb-8 text-lg">
                            Your <strong>Carbon Footprint</strong> is simply the total weight of all those invisible gases your specific lifestyle puts into the air over a whole year. It is usually measured in "Metric Tons." For example, the average global citizen might have a footprint of 5 to 10 Tons a year. 
                        </p>
                        
                        <div className="bg-[#F4F3ED] border-l-4 border-[#3B8266] p-6 rounded-r-2xl shadow-sm">
                            <p className="text-[#1A2115] font-medium leading-relaxed italic text-lg">
                                "We cannot fix a problem we don't understand. By calculating your exact footprint, you can see exactly how big your invisible mess is. Once you know your number, you can take the next step to clean it up."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Concept 2: Credit */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                    <div className="w-full md:w-1/2">
                        <div className="rounded-[2rem] overflow-hidden shadow-2xl relative group">
                            <div className="absolute inset-0 bg-[#3B8266]/10 z-10 group-hover:bg-transparent transition-colors duration-500"></div>
                            <img src="https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Reforestation and nature" className="w-full h-[600px] object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 md:pr-8">
                        <span className="text-5xl block mb-6">🌿</span>
                        <h3 className="text-3xl md:text-5xl font-['Montenegrin_Gothic_One'] text-[#1A2115] mb-6 font-bold leading-tight">What is a Carbon Credit?</h3>
                        
                        <p className="text-[#4A533E] font-light leading-relaxed mb-5 text-lg">
                            Even if you try your absolute hardest to be green, it is almost impossible to live a modern life with a footprint of zero. You still need to travel, eat, and use electricity. So, how do you clean up the pollution you simply cannot avoid? This is where global teamwork comes in.
                        </p>
                        <p className="text-[#4A533E] font-light leading-relaxed mb-5 text-lg">
                            All over the world, brilliant innovators, farmers, and engineers are running "green projects." They might be planting massive forests that breathe in CO₂, building huge solar panel fields to replace coal plants, or capturing harmful methane gas from city landfills. These projects are actively healing the planet.
                        </p>
                        <p className="text-[#4A533E] font-light leading-relaxed mb-8 text-lg">
                            When scientists and auditors prove that one of these projects has successfully removed exactly 1 Metric Ton of pollution from the atmosphere, the project is awarded a highly secure, digital certificate. This certificate is called a <strong>Carbon Credit</strong>. Think of it as a verified receipt for cleaning up 1 Ton of pollution.
                        </p>

                        <div className="bg-[#1A2115] border-l-4 border-[#6DD58C] p-6 rounded-r-2xl shadow-xl">
                            <p className="text-[#F4F3ED] font-medium leading-relaxed italic text-lg">
                                "By purchasing a Carbon Credit, you are sending your money directly to those green projects, funding their hard work. Their clean-up effort mathematically cancels out your footprint, bringing your personal impact to an absolute Net Zero."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* HOW IT WORKS SECTION */}
        <div className="bg-[#1A2115] py-24 px-6 text-[#F4F3ED]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-4xl md:text-5xl font-['Montenegrin_Gothic_One'] text-[#6DD58C] mb-4 font-bold">How The Simulation Works</h2>
                    <p className="text-[#8B937D] font-light text-lg">Explore the workflows of both impact investors and project developers.</p>
                </div>

                {/* Flow Toggle Switch */}
                <div className="flex justify-center mb-16">
                    <div className="bg-[#222B1C] p-1.5 rounded-full flex gap-2 border border-[#2C3524] shadow-inner">
                        <button 
                            onClick={() => setActiveFlow('buyer')}
                            className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${activeFlow === 'buyer' ? 'bg-[#3B8266] text-[#F4F3ED] shadow-lg shadow-[#3B8266]/20' : 'text-[#8B937D] hover:text-[#F4F3ED]'}`}
                        >
                            I want to Offset
                        </button>
                        <button 
                            onClick={() => setActiveFlow('seller')}
                            className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${activeFlow === 'seller' ? 'bg-[#3B8266] text-[#F4F3ED] shadow-lg shadow-[#3B8266]/20' : 'text-[#8B937D] hover:text-[#F4F3ED]'}`}
                        >
                            I am a Developer
                        </button>
                    </div>
                </div>

                {/* Steps based on selected flow */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center transition-all duration-500">
                    {activeFlow === 'buyer' ? (
                        <>
                            <div className="p-8 border border-[#2C3524] rounded-[2rem] bg-[#222B1C]">
                                <div className="w-16 h-16 bg-[#3B8266]/20 text-[#6DD58C] rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">1</div>
                                <h3 className="text-2xl font-['Montenegrin_Gothic_One'] mb-3 font-bold">Calculate</h3>
                                <p className="text-[#8B937D] font-light text-sm leading-relaxed">Use our built-in educational calculator to estimate your annual emissions based on your travel and energy usage.</p>
                            </div>
                            <div className="p-8 border border-[#2C3524] rounded-[2rem] bg-[#222B1C]">
                                <div className="w-16 h-16 bg-[#3B8266]/20 text-[#6DD58C] rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">2</div>
                                <h3 className="text-2xl font-['Montenegrin_Gothic_One'] mb-3 font-bold">AI Match</h3>
                                <p className="text-[#8B937D] font-light text-sm leading-relaxed">Watch our Python-based AI Engine analyze the simulated marketplace to find a project that matches your footprint.</p>
                            </div>
                            <div className="p-8 border border-[#2C3524] rounded-[2rem] bg-[#222B1C]">
                                <div className="w-16 h-16 bg-[#3B8266]/20 text-[#6DD58C] rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">3</div>
                                <h3 className="text-2xl font-['Montenegrin_Gothic_One'] mb-3 font-bold">Fund</h3>
                                <p className="text-[#8B937D] font-light text-sm leading-relaxed">Execute a simulated purchase securely. You receive a digital PDF certificate as proof of your mock transaction.</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-8 border border-[#2C3524] rounded-[2rem] bg-[#222B1C]">
                                <div className="w-16 h-16 bg-[#3B8266]/20 text-[#6DD58C] rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">1</div>
                                <h3 className="text-2xl font-['Montenegrin_Gothic_One'] mb-3 font-bold">List Asset</h3>
                                <p className="text-[#8B937D] font-light text-sm leading-relaxed">Deploy a mock green project on our platform by entering its capacity and a test 3rd-party compliance code.</p>
                            </div>
                            <div className="p-8 border border-[#2C3524] rounded-[2rem] bg-[#222B1C]">
                                <div className="w-16 h-16 bg-[#3B8266]/20 text-[#6DD58C] rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">2</div>
                                <h3 className="text-2xl font-['Montenegrin_Gothic_One'] mb-3 font-bold">Underwriting</h3>
                                <p className="text-[#8B937D] font-light text-sm leading-relaxed">Understand the role of platform Admins who verify registry codes (e.g., VERRA) to ensure global market integrity.</p>
                            </div>
                            <div className="p-8 border border-[#2C3524] rounded-[2rem] bg-[#222B1C]">
                                <div className="w-16 h-16 bg-[#3B8266]/20 text-[#6DD58C] rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">3</div>
                                <h3 className="text-2xl font-['Montenegrin_Gothic_One'] mb-3 font-bold">Liquidate</h3>
                                <p className="text-[#8B937D] font-light text-sm leading-relaxed">Once approved, your assets go live on the public exchange, allowing you to track simulated revenue as buyers invest.</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* BENEFITS SECTION */}
        <div id="benefits" className="py-24 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <span className="text-[#3B8266] text-xs font-bold tracking-[0.2em] uppercase mb-3 block">Why Participate?</span>
                <h2 className="text-4xl md:text-5xl font-['Montenegrin_Gothic_One'] text-[#1A2115] mb-4 font-bold">A Win-Win Ecosystem</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-[#F4F3ED] rounded-[2rem] p-10 border border-[#E5E4DE] relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 w-2 h-full bg-[#1A2115]"></div>
                    <h3 className="text-2xl font-['Montenegrin_Gothic_One'] text-[#1A2115] mb-6 font-bold">For Everyday Individuals</h3>
                    <ul className="space-y-6">
                        <li className="flex gap-4 items-start">
                            <span className="text-[#3B8266] text-xl mt-1">✓</span>
                            <div>
                                <strong className="block text-[#1A2115] mb-1 text-lg">Achieve Net Zero</strong>
                                <span className="text-[#4A533E] text-md font-light leading-relaxed">Sleep easy knowing you have legally neutralized your personal impact on the Earth.</span>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="text-[#3B8266] text-xl mt-1">✓</span>
                            <div>
                                <strong className="block text-[#1A2115] mb-1 text-lg">Support Real Change</strong>
                                <span className="text-[#4A533E] text-md font-light leading-relaxed">Your money doesn't go to charities blindly; it buys verified, audited environmental assets.</span>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="text-[#3B8266] text-xl mt-1">✓</span>
                            <div>
                                <strong className="block text-[#1A2115] mb-1 text-lg">Digital Proof</strong>
                                <span className="text-[#4A533E] text-md font-light leading-relaxed">Generate official PDF certificates of your offsets to share with employers or friends.</span>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="bg-[#F4F3ED] rounded-[2rem] p-10 border border-[#E5E4DE] relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 w-2 h-full bg-[#3B8266]"></div>
                    <h3 className="text-2xl font-['Montenegrin_Gothic_One'] text-[#1A2115] mb-6 font-bold">For Green Project Developers</h3>
                    <ul className="space-y-6">
                        <li className="flex gap-4 items-start">
                            <span className="text-[#1A2115] text-xl mt-1">✓</span>
                            <div>
                                <strong className="block text-[#1A2115] mb-1 text-lg">Monetize Your Hard Work</strong>
                                <span className="text-[#4A533E] text-md font-light leading-relaxed">Turn your solar farm, forest, or biogas project into a direct revenue stream.</span>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="text-[#1A2115] text-xl mt-1">✓</span>
                            <div>
                                <strong className="block text-[#1A2115] mb-1 text-lg">Bypass Corporate Gatekeepers</strong>
                                <span className="text-[#4A533E] text-md font-light leading-relaxed">Instead of waiting years for massive corporate deals, sell directly to the public instantly.</span>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start">
                            <span className="text-[#1A2115] text-xl mt-1">✓</span>
                            <div>
                                <strong className="block text-[#1A2115] mb-1 text-lg">Scale Your Project</strong>
                                <span className="text-[#4A533E] text-md font-light leading-relaxed">Use the capital raised from our global liquidity pool to expand your environmental efforts.</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <footer className="bg-[#1A2115] py-10 text-center border-t border-[#2C3524]">
            <p className="text-[#8B937D] text-sm font-light tracking-wide">© 2026 KarbonEd Educational Platform. A commitment to learning and the planet.</p>
        </footer>
      </div>
    );
}

function Login({ user, setUser }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const endpoint = isLoginMode ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';
    const payload = isLoginMode ? { email, password } : { name, email, password, role };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (response.ok) {
        setUser({ id: data.user.id, name: data.user.name, role: data.user.role, token: data.token });
      } else {
        setMessage(`Authentication Failed: ${data.error}`);
      }
    } catch (error) { setMessage("Could not connect to the server."); }
  };

  if (user) {
      if (user.role === 'buyer') return <Navigate to="/marketplace" />;
      if (user.role === 'seller') return <Navigate to="/seller" />;
      if (user.role === 'admin') return <Navigate to="/admin" />;
  }

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-12 px-6">
      <div className="bg-white p-10 rounded-[2rem] shadow-2xl border border-[#E5E4DE] w-full max-w-md relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B8266] opacity-10 rounded-bl-full pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
            <h2 className="text-3xl font-['Montenegrin_Gothic_One'] text-[#1A2115] font-bold mb-2">
                {isLoginMode ? 'Welcome Back' : 'Join KarbonEd'}
            </h2>
            <p className="text-[#8B937D] font-light text-sm">
                {isLoginMode ? 'Access your private simulation portfolio.' : 'Register to begin your educational journey.'}
            </p>
        </div>

        {message && <div className="bg-[#1A2115] text-[#6DD58C] p-4 rounded-xl mb-6 text-sm text-center font-medium">{message}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {!isLoginMode && (
            <div>
              <label className="block text-[#1A2115] text-xs font-bold uppercase tracking-widest mb-2">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required 
                 className="w-full bg-[#F4F3ED] border border-[#E5E4DE] rounded-xl px-4 py-3 text-[#1A2115] focus:outline-none focus:border-[#3B8266] focus:ring-1 focus:ring-[#3B8266] transition-all font-light" />
            </div>
          )}
          
          <div>
            <label className="block text-[#1A2115] text-xs font-bold uppercase tracking-widest mb-2">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
                 className="w-full bg-[#F4F3ED] border border-[#E5E4DE] rounded-xl px-4 py-3 text-[#1A2115] focus:outline-none focus:border-[#3B8266] focus:ring-1 focus:ring-[#3B8266] transition-all font-light" />
          </div>

          <div>
            <label className="block text-[#1A2115] text-xs font-bold uppercase tracking-widest mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required 
                 className="w-full bg-[#F4F3ED] border border-[#E5E4DE] rounded-xl px-4 py-3 text-[#1A2115] focus:outline-none focus:border-[#3B8266] focus:ring-1 focus:ring-[#3B8266] transition-all font-light" />
          </div>
          
          {!isLoginMode && (
            <div>
              <label className="block text-[#1A2115] text-xs font-bold uppercase tracking-widest mb-2">Account Type</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} 
                 className="w-full bg-[#F4F3ED] border border-[#E5E4DE] rounded-xl px-4 py-3 text-[#1A2115] focus:outline-none focus:border-[#3B8266] appearance-none font-light">
                <option value="buyer">Investor (Buy Mock Offsets)</option>
                <option value="seller">Developer (Sell Mock Offsets)</option>
              </select>
            </div>
          )}

          <button type="submit" className="w-full bg-[#1A2115] hover:bg-[#2C3524] text-[#6DD58C] py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-colors mt-4 shadow-lg shadow-[#1A2115]/10">
            {isLoginMode ? 'Secure Login' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#E5E4DE] text-center relative z-10">
          <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-[#8B937D] hover:text-[#1A2115] text-sm font-medium transition-colors">
            {isLoginMode ? "Require an account? Register here." : "Already registered? Sign in."}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessHandler({ user, handleBuy }) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const creditId = searchParams.get('creditId');
    const amount = searchParams.get('amount');
    const [processed, setProcessed] = useState(false);

    useEffect(() => {
        if (creditId && amount && !processed) {
            setProcessed(true);
            setTimeout(() => {
                handleBuy(creditId, amount);
                navigate('/wallet'); 
            }, 1500);
        } else if (!creditId) {
            navigate('/marketplace');
        }
    }, [creditId, amount, navigate, handleBuy, processed]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
            <div className="bg-white p-12 rounded-[2rem] shadow-xl border border-[#E5E4DE] max-w-lg w-full">
                <div className="w-20 h-20 bg-[#3B8266]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🌍</span>
                </div>
                <h1 className="text-3xl font-['Montenegrin_Gothic_One'] text-[#1A2115] font-bold mb-4">Payment Confirmed</h1>
                <p className="text-[#8B937D] font-light text-lg mb-8">
                    Your Stripe transaction was successful. We are issuing your digital certificate and updating the global ledger...
                </p>
                <div className="w-full bg-[#F4F3ED] rounded-full h-2 mb-4 overflow-hidden">
                    <div className="bg-[#1A2115] h-2 rounded-full animate-[pulse_1s_ease-in-out_infinite] w-3/4"></div>
                </div>
            </div>
        </div>
    );
}

function Marketplace({ credits, user }) {
  const [purchaseAmounts, setPurchaseAmounts] = useState({});

  // NEW: This effect listens for the jump command from the Calculator search bar!
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && credits.length > 0) {
      setTimeout(() => {
        // Find the specific card using the ID in the URL
        const element = document.getElementById(hash.substring(1));
        if (element) {
          // Smoothly scroll to the center of the screen
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Make the card glow green so the user spots it easily!
          const originalTransition = element.style.transition;
          element.style.transition = "all 0.5s ease-in-out";
          element.style.boxShadow = "0 0 30px #6DD58C"; 
          
          // Remove the glow after 3 seconds
          setTimeout(() => {
            element.style.boxShadow = "none";
            element.style.transition = originalTransition;
          }, 3000);
        }
      }, 300); // 300ms delay ensures React has finished painting the cards
    }
  }, [credits, window.location.hash]);

  const verifiedCredits = credits.filter(credit => credit.isVerified && credit.offsetAmount > 0);
  const totalVerifiedOffsets = verifiedCredits.reduce((sum, credit) => sum + Number(credit.offsetAmount), 0);

  const onAmountChange = (id, value) => {
    setPurchaseAmounts({ ...purchaseAmounts, [id]: value });
  };

  const initiateStripeCheckout = async (credit) => {
      const amount = Number(purchaseAmounts[credit._id]);
      if (!amount || amount <= 0 || amount > credit.offsetAmount) {
          alert("Please enter a valid amount of tons.");
          return;
      }
      try {
          const response = await fetch('http://localhost:5000/api/stripe/create-checkout-session', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.token}`
              },
              body: JSON.stringify({
                  creditId: credit._id,
                  projectName: credit.projectName,
                  amount: amount,
                  pricePerTon: credit.pricePerTon
              })
          });
          const data = await response.json();
          if (data.url) window.location.href = data.url; 
          else alert("Stripe error: " + (data.error || "Unknown error"));
      } catch (error) {
          console.error("Checkout failed:", error);
          alert("Failed to connect to the payment gateway.");
      }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10">
      <div className="text-center mb-12">
          <span className="text-[#3B8266] text-xs font-bold tracking-[0.2em] uppercase mb-3 block">Global Liquidity</span>
          <h1 className="text-4xl md:text-5xl font-['Montenegrin_Gothic_One'] text-[#1A2115] mb-4 font-bold">The Public Exchange</h1>
          <p className="text-[#8B937D] text-lg font-light">Browse, evaluate, and fund globally verified environmental initiatives.</p>
      </div>
      
      <div className="bg-[#1A2115] p-8 md:p-12 rounded-[2rem] text-center mb-16 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B8266] opacity-20 rounded-full blur-[80px] pointer-events-none"></div>
        <span className="text-[#8B937D] text-xs font-bold tracking-[0.2em] uppercase mb-4 block relative z-10">Total Market Capacity</span>
        <h2 className="text-5xl md:text-6xl font-['Montenegrin_Gothic_One'] text-[#6DD58C] font-bold mb-2 relative z-10">
            {totalVerifiedOffsets.toLocaleString()} <span className="text-2xl text-[#F4F3ED] font-['Inter'] font-light">Tons CO₂e</span>
        </h2>
      </div>

      <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-[#E5E4DE] flex-grow"></div>
          <h2 className="text-[#1A2115] font-['Montenegrin_Gothic_One'] text-2xl font-bold">Live Order Book</h2>
          <div className="h-px bg-[#E5E4DE] flex-grow"></div>
      </div>

      {verifiedCredits.length === 0 ? (
        <p className="text-center text-[#8B937D] italic p-10 bg-white rounded-3xl border border-[#E5E4DE]">Market closed. No verified assets currently liquid.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {verifiedCredits.map(credit => (
            <div key={credit._id} id={credit._id} className="bg-[#1A2115] rounded-[1.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col group hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#3B8266] opacity-10 rounded-full blur-3xl pointer-events-none group-hover:opacity-20 transition-opacity"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[#6DD58C] text-[10px] uppercase tracking-widest font-bold block bg-[#3B8266]/20 px-2 py-1 rounded border border-[#3B8266]/30">Verified Asset</span>
                </div>
                
                <h3 className="text-2xl font-['Montenegrin_Gothic_One'] text-[#F4F3ED] mb-2 font-bold">{credit.projectName}</h3>
                <p className="text-[#8B937D] text-sm mb-8 font-light border-b border-[#2C3524] pb-4">Dev: {credit.companyName}</p>
                
                <div className="mt-auto pt-2">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                          <p className="text-[10px] text-[#8B937D] uppercase tracking-wider mb-1 font-semibold">Available</p>
                          <p className="text-xl font-['Inter'] text-[#F4F3ED] font-light">{credit.offsetAmount} <span className="text-sm text-[#8B937D]">Tons</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-[#8B937D] uppercase tracking-wider mb-1 font-semibold">Market Price</p>
                          <p className="text-2xl font-['Montenegrin_Gothic_One'] text-[#6DD58C] font-bold">₹{credit.pricePerTon} <span className="text-xs font-['Inter'] text-[#8B937D] font-light">/t</span></p>
                        </div>
                    </div>

                    {user?.role === 'buyer' ? (
                        <div className="flex gap-3 items-stretch">
                          <input 
                            type="number" 
                            min="1" 
                            max={credit.offsetAmount}
                            placeholder="Qty"
                            value={purchaseAmounts[credit._id] || ''}
                            onChange={(e) => onAmountChange(credit._id, e.target.value)}
                            className="w-24 bg-[#2C3524] border border-[#4A533E] text-[#F4F3ED] rounded-xl px-4 py-2 focus:outline-none focus:border-[#6DD58C] font-light"
                          />
                          <button 
                            onClick={() => initiateStripeCheckout(credit)}
                            className="flex-grow bg-[#3B8266] hover:bg-[#4E9C7D] text-[#F4F3ED] rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-lg shadow-[#3B8266]/20"
                          >
                            Execute Trade
                          </button>
                        </div>
                    ) : (
                        <div className="text-center text-[#6DD58C] bg-[#3B8266]/20 border border-[#3B8266]/30 text-xs font-bold uppercase tracking-widest p-3 rounded-xl mt-2">
                          Login as Investor to Trade
                        </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BuyerDashboard({ user, credits, handleBuy }) {
  if (user?.role !== 'buyer') return <Navigate to="/login" />;

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visiblePurchases, setVisiblePurchases] = useState(5);

  useEffect(() => {
    fetch('http://localhost:5000/api/transactions/my-purchases', {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(res => res.json())
      .then(data => { setPurchases(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [user.token]);

  const totalImpact = purchases.reduce((sum, p) => sum + p.amountPurchased, 0);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="bg-[#1A2115] rounded-[2rem] p-10 md:p-14 text-center text-white mb-10 shadow-2xl relative overflow-hidden">
        <span className="text-[#6DD58C] text-xs font-bold tracking-[0.2em] uppercase mb-4 block relative z-10">Portfolio Summary</span>
        <h3 className="text-2xl font-light text-[#8B937D] mb-2 relative z-10">Lifetime Neutralization</h3>
        <h1 className="text-6xl md:text-7xl font-['Montenegrin_Gothic_One'] text-[#F4F3ED] font-bold relative z-10">
            {totalImpact.toLocaleString()} <span className="text-2xl font-['Inter'] text-[#6DD58C] font-light">Tons CO₂e</span>
        </h1>
      </div>

      {/* FIX: We are now passing handleBuy into the calculator! */}
      <CarbonCalculator user={user} credits={credits} handleBuy={handleBuy} />

      <div className="mt-16">
          <h2 className="text-3xl font-['Montenegrin_Gothic_One'] text-[#1A2115] border-b border-[#E5E4DE] pb-4 mb-8 font-bold">Ledger & Certificates</h2>
          
          {loading ? <p className="text-[#8B937D] italic">Decrypting ledger data...</p> : purchases.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-[2rem] border border-[#E5E4DE]">
                 <span className="text-4xl block mb-4 opacity-50">📜</span>
                 <p className="text-[#8B937D] text-lg font-light">Your portfolio is currently empty.</p>
            </div>
          ) : (
            <>
                <div className="space-y-6">
                  {purchases.slice(0, visiblePurchases).map(receipt => (
                    <div key={receipt._id} className="bg-[#1A2115] p-6 md:p-8 rounded-[1.5rem] shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:-translate-y-1 transition-transform group border border-[#2C3524]">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-[#3B8266] opacity-10 rounded-full blur-3xl pointer-events-none group-hover:opacity-20 transition-opacity"></div>
                      
                      <div className="relative z-10 w-full md:w-auto">
                        <span className="text-[#6DD58C] text-[10px] uppercase tracking-widest font-bold block mb-3 bg-[#3B8266]/20 border border-[#3B8266]/30 w-fit px-3 py-1 rounded-sm">Asset Secured</span>
                        <h3 className="text-2xl md:text-3xl font-['Montenegrin_Gothic_One'] text-[#F4F3ED] font-bold mb-2">{receipt.projectName}</h3>
                        <p className="text-[#8B937D] text-sm font-light border-b border-[#2C3524] pb-3 mb-3 inline-block min-w-[200px]">Originator: {receipt.companyName}</p>
                        <p className="text-[#4A533E] text-[10px] font-mono uppercase tracking-widest block">Acquired: {new Date(receipt.purchaseDate).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="relative z-10 w-full md:w-auto text-left md:text-right bg-[#2C3524]/40 border border-[#4A533E] p-6 rounded-2xl min-w-[180px] shadow-inner">
                        <p className="text-[10px] text-[#8B937D] uppercase tracking-widest mb-1 font-semibold">Impact Value</p>
                        <h3 className="text-3xl font-bold text-[#F4F3ED] mb-3">+{receipt.amountPurchased} <span className="text-sm font-light text-[#8B937D]">Tons</span></h3>
                        
                        <div className="border-t border-[#4A533E] pt-3 mt-1">
                            <p className="text-[10px] text-[#8B937D] uppercase tracking-widest mb-1 font-semibold">Capital Deployed</p>
                            <p className="text-[#6DD58C] text-xl font-['Montenegrin_Gothic_One'] font-bold tracking-wide">₹{receipt.pricePaid.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {purchases.length > visiblePurchases && (
                    <div className="mt-10 text-center">
                        <button 
                            onClick={() => setVisiblePurchases(prev => prev + 5)}
                            className="bg-[#1A2115] hover:bg-[#2C3524] text-[#6DD58C] px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors shadow-xl shadow-[#1A2115]/10"
                        >
                            Load Older Receipts ↓
                        </button>
                    </div>
                )}
            </>
          )}
      </div>
    </div>
  );
}

function SellerPortal({ credits, setCredits, user }) {
  if (user?.role !== 'seller') return <Navigate to="/login" />;

  const [formData, setFormData] = useState({ projectName: '', companyName: '', offsetAmount: '', pricePerTon: '', thirdPartyVerificationCode: '' });
  const [submitMessage, setSubmitMessage] = useState('');
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);

  const [visibleSales, setVisibleSales] = useState(5);
  const [visibleProjects, setVisibleProjects] = useState(5);

  useEffect(() => {
    fetch('http://localhost:5000/api/transactions/my-sales', { headers: { 'Authorization': `Bearer ${user.token}` }})
      .then(res => res.json())
      .then(data => { setSales(data); setLoadingSales(false); })
      .catch(err => { console.error(err); setLoadingSales(false); });
  }, [user.token]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault(); 
    fetch('http://localhost:5000/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
      body: JSON.stringify(formData) 
    })
      .then(res => res.json())
      .then(newCredit => {
        setCredits([...credits, newCredit]);
        setFormData({ projectName: '', companyName: '', offsetAmount: '', pricePerTon: '', thirdPartyVerificationCode: '' });
        if (newCredit.isVerified) setSubmitMessage('✅ Success! Asset verified and liquid.');
        else setSubmitMessage('⏳ Asset listed. Pending compliance audit.');
        setTimeout(() => setSubmitMessage(''), 8000);
      });
  };

  const activeProjects = credits.filter(c => c.sellerId === user.id);
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.pricePaid, 0);
  const totalTonsSold = sales.reduce((sum, sale) => sum + sale.amountPurchased, 0);

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10">
      <div className="mb-12">
          <span className="text-[#3B8266] text-xs font-bold tracking-[0.2em] uppercase mb-3 block">Developer Suite</span>
          <h1 className="text-4xl md:text-5xl font-['Montenegrin_Gothic_One'] text-[#1A2115] font-bold">Asset Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-[#1A2115] p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
           <h3 className="text-[#8B937D] text-xs uppercase tracking-widest font-bold mb-4 relative z-10">Gross Yield</h3>
           <h1 className="text-4xl font-['Montenegrin_Gothic_One'] text-[#6DD58C] font-bold relative z-10">₹{totalRevenue.toLocaleString()}</h1>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-[#E5E4DE] shadow-lg">
           <h3 className="text-[#8B937D] text-xs uppercase tracking-widest font-bold mb-4">Volume Liquidated</h3>
           <h1 className="text-4xl font-['Montenegrin_Gothic_One'] text-[#1A2115] font-bold">{totalTonsSold.toLocaleString()} <span className="text-xl font-light font-['Inter']">Tons</span></h1>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-[#E5E4DE] shadow-lg">
           <h3 className="text-[#8B937D] text-xs uppercase tracking-widest font-bold mb-4">Active Listings</h3>
           <h1 className="text-4xl font-['Montenegrin_Gothic_One'] text-[#1A2115] font-bold">{activeProjects.length}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-['Montenegrin_Gothic_One'] text-[#1A2115] border-b border-[#E5E4DE] pb-4 mb-6 font-bold">Deploy New Asset</h2>
          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-[#E5E4DE] hover:border-[#1A2115] hover:ring-2 hover:ring-[#1A2115] transition-all duration-300">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="projectName" value={formData.projectName} onChange={handleInputChange} placeholder="Project Identifier (e.g. Amazon REDD+)" required 
                className="w-full bg-[#F4F3ED] border border-[#E5E4DE] hover:border-[#1A2115] transition-colors duration-300 rounded-xl px-4 py-3 text-[#1A2115] focus:outline-none focus:border-[#3B8266] focus:ring-1 focus:ring-[#3B8266] font-light" />
              <input name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="Originating Entity" required 
                className="w-full bg-[#F4F3ED] border border-[#E5E4DE] hover:border-[#1A2115] transition-colors duration-300 rounded-xl px-4 py-3 text-[#1A2115] focus:outline-none focus:border-[#3B8266] focus:ring-1 focus:ring-[#3B8266] font-light" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" name="offsetAmount" value={formData.offsetAmount} onChange={handleInputChange} placeholder="Capacity (Tons)" required 
                    className="w-full bg-[#F4F3ED] border border-[#E5E4DE] hover:border-[#1A2115] transition-colors duration-300 rounded-xl px-4 py-3 text-[#1A2115] focus:outline-none focus:border-[#3B8266] focus:ring-1 focus:ring-[#3B8266] font-light" />
                <input type="number" name="pricePerTon" value={formData.pricePerTon} onChange={handleInputChange} placeholder="Floor Price (₹/t)" required 
                    className="w-full bg-[#F4F3ED] border border-[#E5E4DE] hover:border-[#1A2115] transition-colors duration-300 rounded-xl px-4 py-3 text-[#1A2115] focus:outline-none focus:border-[#3B8266] focus:ring-1 focus:ring-[#3B8266] font-light" />
              </div>
              <input name="thirdPartyVerificationCode" value={formData.thirdPartyVerificationCode} onChange={handleInputChange} placeholder="Compliance Code (e.g. VERRA-09X)" required 
                className="w-full bg-[#F4F3ED] border border-[#E5E4DE] hover:border-[#1A2115] transition-colors duration-300 rounded-xl px-4 py-3 text-[#1A2115] focus:outline-none focus:border-[#3B8266] focus:ring-1 focus:ring-[#3B8266] font-light font-mono text-sm" />
              <button type="submit" className="w-full bg-[#1A2115] hover:bg-[#2C3524] text-[#6DD58C] py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-colors mt-4 shadow-lg shadow-[#1A2115]/10">
                Submit for Underwriting
              </button>
            </form>
            {submitMessage && (
                <div className="mt-6 p-4 bg-[#1A2115] text-[#6DD58C] rounded-xl text-center text-sm font-medium tracking-wide">
                    {submitMessage}
                </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-['Montenegrin_Gothic_One'] text-[#1A2115] border-b border-[#E5E4DE] pb-4 mb-6 font-bold">Transaction Ledger</h2>
          <div className="bg-white rounded-[2rem] shadow-xl border border-[#E5E4DE] overflow-hidden">
            {loadingSales ? <p className="p-8 text-[#8B937D] italic text-center">Syncing ledger...</p> : sales.length === 0 ? (
              <div className="text-center p-12">
                <span className="text-4xl block mb-4 opacity-50">🧾</span>
                <p className="text-[#8B937D] font-light">No executed blocks found.</p>
              </div>
            ) : (
              <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#1A2115] text-[#F4F3ED] uppercase tracking-widest text-[10px] font-bold">
                          <th className="p-5">Asset Sold</th>
                          <th className="p-5 text-right">Vol</th>
                          <th className="p-5 text-right">Yield</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-light text-[#1A2115]">
                        {sales.slice(0, visibleSales).map((sale, index) => (
                          <tr key={sale._id} className={`border-b border-[#E5E4DE] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#F4F3ED]'}`}>
                            <td className="p-5 font-medium">{sale.projectName}</td>
                            <td className="p-5 text-right font-bold text-[#4A533E]">{sale.amountPurchased}T</td>
                            <td className="p-5 text-right font-['Montenegrin_Gothic_One'] font-bold text-[#1A2115] text-lg">₹{sale.pricePaid.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {sales.length > visibleSales && (
                    <div className="p-4 bg-[#F4F3ED] border-t border-[#E5E4DE] text-center">
                        <button 
                            onClick={() => setVisibleSales(prev => prev + 5)}
                            className="text-[#8B937D] hover:text-[#1A2115] text-[10px] font-bold uppercase tracking-widest transition-colors"
                        >
                            View More Transactions ↓
                        </button>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
          <h2 className="text-2xl font-['Montenegrin_Gothic_One'] text-[#1A2115] border-b border-[#E5E4DE] pb-4 mb-6 font-bold">Your Live Projects</h2>
          <div className="bg-white rounded-[2rem] shadow-xl border border-[#E5E4DE] overflow-hidden">
              {activeProjects.length === 0 ? (
                  <div className="text-center p-12">
                      <span className="text-4xl block mb-4 opacity-50">🌱</span>
                      <p className="text-[#8B937D] font-light">You have no active projects listed.</p>
                  </div>
              ) : (
                  <>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-[#1A2115] text-[#F4F3ED] uppercase tracking-widest text-[10px] font-bold">
                                      <th className="p-5">Project Name</th>
                                      <th className="p-5 text-right">Remaining Capacity</th>
                                      <th className="p-5 text-right">Floor Price</th>
                                      <th className="p-5 text-center">Status</th>
                                  </tr>
                              </thead>
                              <tbody className="text-sm font-light text-[#1A2115]">
                                  {activeProjects.slice(0, visibleProjects).map((project, index) => (
                                      <tr key={project._id} className={`border-b border-[#E5E4DE] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#F4F3ED]'}`}>
                                          <td className="p-5 font-medium">{project.projectName}</td>
                                          <td className="p-5 text-right font-bold text-[#4A533E]">{project.offsetAmount}T</td>
                                          <td className="p-5 text-right font-['Montenegrin_Gothic_One'] font-bold text-[#1A2115] text-lg">₹{project.pricePerTon}</td>
                                          <td className="p-5 text-center">
                                              {project.isVerified ? 
                                                  <span className="text-green-700 bg-green-50 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold">Verified & Live</span> : 
                                                  <span className="text-[#8B937D] bg-[#F4F3ED] border border-[#E5E4DE] px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold">Pending Audit</span>
                                              }
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                      {activeProjects.length > visibleProjects && (
                        <div className="p-4 bg-[#F4F3ED] border-t border-[#E5E4DE] text-center">
                            <button 
                                onClick={() => setVisibleProjects(prev => prev + 5)}
                                className="text-[#8B937D] hover:text-[#1A2115] text-[10px] font-bold uppercase tracking-widest transition-colors"
                            >
                                View More Projects ↓
                            </button>
                        </div>
                      )}
                  </>
              )}
          </div>
      </div>

    </div>
  );
}

function App() {
  const [credits, setCredits] = useState([]);
  const [sysMessage, setSysMessage] = useState('');

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('karbonEd_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem('karbonEd_user', JSON.stringify(user));
    else localStorage.removeItem('karbonEd_user');
  }, [user]);

  const displayMessage = (msg) => {
    setSysMessage(msg);
    setTimeout(() => setSysMessage(''), 5000); 
  }

  useEffect(() => {
    const fetchMarketplaceData = () => {
      fetch('http://localhost:5000/api/credits')
        .then(response => response.json())
        .then(data => setCredits(data))
        .catch(error => console.error("Database connection failed", error));
    };
    fetchMarketplaceData();
    const intervalId = setInterval(fetchMarketplaceData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleBuy = (id, amountToBuy) => {
    const amount = Number(amountToBuy);

    if (!amount || amount <= 0) {
      return displayMessage("❌ Invalid volume parameters.");
    }

    fetch(`http://localhost:5000/api/transactions/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
      body: JSON.stringify({ creditId: id, amountToBuy: amount }) 
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) return displayMessage(`❌ Error: ${data.error}`);
        
        setCredits(prevCredits => prevCredits.map(c => c._id === id ? data.updatedCredit : c));
        displayMessage(`✅ Transaction executed. ${amount} tons secured.`);
        
        generateCertificate(data.transaction, user); 
      })
      .catch(err => displayMessage("❌ Mainframe disconnect."));
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#F4F3ED] font-['Inter'] text-[#1A2115] flex flex-col">
        <Navbar user={user} setUser={setUser} />
        
        {sysMessage && (
          <div className="bg-[#1A2115] text-[#6DD58C] p-4 text-center text-sm font-bold uppercase tracking-widest sticky top-[72px] z-40 border-b border-[#2C3524] shadow-md">
            {sysMessage}
          </div>
        )}

        <div className="flex-grow">
            <Routes>
              {!user && (
                <>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<Login user={user} setUser={setUser} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </>
              )}

              {user?.role === 'buyer' && (
                <>
                  <Route path="/" element={<Navigate to="/marketplace" />} />
                  <Route path="/marketplace" element={<Marketplace credits={credits} user={user} />} />
                  <Route path="/wallet" element={<BuyerDashboard user={user} credits={credits} handleBuy={handleBuy} />} />                  
                  <Route path="/success" element={<SuccessHandler user={user} handleBuy={handleBuy} />} />
                  <Route path="*" element={<Navigate to="/marketplace" />} />
                </>
              )}

              {user?.role === 'seller' && (
                <>
                  <Route path="/" element={<Navigate to="/seller" />} />
                  <Route path="/seller" element={<SellerPortal credits={credits} setCredits={setCredits} user={user} />} />
                  <Route path="*" element={<Navigate to="/seller" />} />
                </>
              )}

              {user?.role === 'admin' && (
                <>
                  <Route path="/" element={<Navigate to="/admin" />} />
                  <Route path="/admin" element={<AdminDashboard token={user.token} credits={credits} setCredits={setCredits} />} />
                  <Route path="*" element={<Navigate to="/admin" />} />
                </>
              )}
            </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;