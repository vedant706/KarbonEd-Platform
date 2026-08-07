import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // NEW: Added to handle page jumping!

export const CarbonCalculator = ({ user, credits }) => {
  const navigate = useNavigate(); // NEW: Hook to jump pages
  
  const [miles, setMiles] = useState('');
  const [flights, setFlights] = useState('');
  const [energy, setEnergy] = useState('');
  
  const [directTons, setDirectTons] = useState('');
  const [inputMode, setInputMode] = useState('calculator'); 

  const [result, setResult] = useState(null);
  const [recommendation, setRecommendation] = useState("");
  
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(false);

  const [aiPriority, setAiPriority] = useState("balanced");
  const [searchQuery, setSearchQuery] = useState("");

  const calculateFootprint = () => {
    setError("");
    setRecommendation("");
    setAiError("");

    if (inputMode === 'direct') {
      const tons = Number(directTons);
      if (tons <= 0 || isNaN(tons)) {
        setError("Please enter a valid tonnage amount.");
        return;
      }
      setResult(tons.toFixed(2));
      return;
    }

    const m = Number(miles);
    const f = Number(flights);
    const e = Number(energy);

    if (m < 0 || f < 0 || e < 0) {
      setError("Values cannot be negative. Please enter valid amounts.");
      return;
    }

    if (miles === '' && flights === '' && energy === '') {
      setError("Please enter at least one value to calculate your footprint.");
      return;
    }

    const footprint = (m * 0.0004) + (f * 0.5) + (e * 0.00015);
    setResult(footprint.toFixed(2));
  };

  const getAIRecommendation = async () => {
    setAiError("");
    setLoading(true);
    
    let pWeight = 0.5;
    let cWeight = 0.5;
    
    if (aiPriority === 'budget') {
        pWeight = 0.8; 
        cWeight = 0.2; 
    } else if (aiPriority === 'capacity') {
        pWeight = 0.2; 
        cWeight = 0.8; 
    }

    try {
      const response = await fetch('http://localhost:5001/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            footprint: result,
            priceWeight: pWeight,
            capacityWeight: cWeight
        })
      });
      
      if (!response.ok) throw new Error("Server error");
      
      const data = await response.json();
      setRecommendation(data.recommendedProject);
    } catch (error) {
      console.error("Error fetching recommendation:", error);
      setAiError("Failed to connect to the AI Service. Please ensure your Python server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-lg border border-[#E5E4DE] mt-10 hover:border-[#1A2115] hover:ring-2 hover:ring-[#1A2115] transition-all duration-300">
      
      {/* HEADER & TABS */}
      <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="text-[#6DD58C] text-xs font-bold tracking-[0.2em] uppercase mb-2 block">Step 1</span>
          <h3 className="text-3xl font-['Montenegrin_Gothic_One'] text-[#1A2115] font-bold">Carbon Footprint Protocol</h3>
          <p className="text-[#8B937D] font-light mt-2">Calculate your footprint or input known enterprise tonnage directly.</p>
        </div>
        
        <div className="bg-[#F4F3ED] p-1.5 rounded-xl flex gap-2 border border-[#E5E4DE]">
          <button 
            onClick={() => { setInputMode('calculator'); setResult(null); setRecommendation(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${inputMode === 'calculator' ? 'bg-[#1A2115] text-[#6DD58C] shadow-md' : 'text-[#8B937D] hover:text-[#1A2115]'}`}
          >
            Consumer Calc
          </button>
          <button 
            onClick={() => { setInputMode('direct'); setResult(null); setRecommendation(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${inputMode === 'direct' ? 'bg-[#1A2115] text-[#6DD58C] shadow-md' : 'text-[#8B937D] hover:text-[#1A2115]'}`}
          >
            B2B Tonnage
          </button>
        </div>
      </div>
      
      {error && <div className="bg-[#1A2115] text-[#6DD58C] p-4 rounded-xl mb-6 text-sm font-medium tracking-wide">{error}</div>}

      {/* INPUT FIELDS */}
      {inputMode === 'calculator' ? (
        <div className="space-y-4 mb-8">
          <div>
              <label className="block text-xs uppercase tracking-widest text-[#8B937D] font-semibold mb-2">Annual Miles Driven</label>
              <input type="number" min="0" placeholder="e.g., 12000" value={miles} onChange={(e) => setMiles(e.target.value)} 
                  className="w-full bg-[#F4F3ED] border border-[#E5E4DE] hover:border-[#1A2115] rounded-xl p-4 text-[#1A2115] focus:outline-none focus:border-[#6DD58C] focus:ring-1 focus:ring-[#6DD58C] transition-all duration-300 font-light" />
          </div>
          <div>
              <label className="block text-xs uppercase tracking-widest text-[#8B937D] font-semibold mb-2">Annual Flights Taken</label>
              <input type="number" min="0" placeholder="e.g., 4" value={flights} onChange={(e) => setFlights(e.target.value)} 
                  className="w-full bg-[#F4F3ED] border border-[#E5E4DE] hover:border-[#1A2115] rounded-xl p-4 text-[#1A2115] focus:outline-none focus:border-[#6DD58C] focus:ring-1 focus:ring-[#6DD58C] transition-all duration-300 font-light" />
          </div>
          <div>
              <label className="block text-xs uppercase tracking-widest text-[#8B937D] font-semibold mb-2">Monthly Energy Bill (₹)</label>
              <input type="number" min="0" placeholder="e.g., 3500" value={energy} onChange={(e) => setEnergy(e.target.value)} 
                  className="w-full bg-[#F4F3ED] border border-[#E5E4DE] hover:border-[#1A2115] rounded-xl p-4 text-[#1A2115] focus:outline-none focus:border-[#6DD58C] focus:ring-1 focus:ring-[#6DD58C] transition-all duration-300 font-light" />
          </div>
        </div>
      ) : (
        <div className="mb-8 bg-[#F4F3ED] p-6 rounded-2xl border border-[#E5E4DE]">
            <label className="block text-xs uppercase tracking-widest text-[#8B937D] font-semibold mb-2">Known Enterprise Tonnage (Metric Tons CO₂e)</label>
            <input type="number" min="0" placeholder="e.g., 500 (from factory bills)" value={directTons} onChange={(e) => setDirectTons(e.target.value)} 
                className="w-full bg-white border border-[#E5E4DE] hover:border-[#1A2115] rounded-xl p-4 text-[#1A2115] focus:outline-none focus:border-[#6DD58C] focus:ring-1 focus:ring-[#6DD58C] transition-all duration-300 font-light" />
            <p className="text-xs text-[#8B937D] mt-2 italic">* Perfect for B2B SME clients who calculated their emissions via enterprise spreadsheets.</p>
        </div>
      )}
      
      <button onClick={calculateFootprint} className="w-full bg-[#1A2115] hover:bg-[#2C3524] text-[#6DD58C] py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-colors shadow-lg">
        {inputMode === 'calculator' ? 'Calculate Tonnage' : 'Lock Tonnage for AI Matching'}
      </button>
      
      {/* AI RECOMMENDATION ENGINE */}
      {result !== null && !error && (
        <div className="mt-10 pt-10 border-t border-[#E5E4DE]">
          <div className="text-center mb-8">
              <p className="text-[#8B937D] text-xs uppercase tracking-widest font-semibold mb-2">Target Offset Requirement</p>
              <h4 className="text-5xl font-['Montenegrin_Gothic_One'] text-[#1A2115] font-bold">{result} <span className="text-2xl text-[#8B937D] font-['Inter'] font-light">Tons CO₂e</span></h4>
          </div>
          
          <div className="bg-[#F4F3ED] p-6 md:p-8 rounded-[1.5rem] border border-[#E5E4DE]">
              <label className="block text-[#1A2115] font-['Montenegrin_Gothic_One'] font-bold text-xl mb-4">
                  Tune the AI Recommendation Engine
              </label>
              <select 
                  value={aiPriority} 
                  onChange={(e) => setAiPriority(e.target.value)}
                  className="w-full bg-white border border-[#E5E4DE] hover:border-[#1A2115] transition-colors duration-300 text-[#4A533E] rounded-xl p-4 mb-6 focus:outline-none focus:border-[#6DD58C] appearance-none font-light"
              >
                  <option value="balanced">⚖️ Balanced (50% Price / 50% Capacity)</option>
                  <option value="budget">💰 Budget Focused (80% Price / 20% Capacity)</option>
                  <option value="capacity">🎯 Exact Amount Focused (20% Price / 80% Capacity)</option>
              </select>
              
              <button onClick={getAIRecommendation} disabled={loading} 
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${loading ? 'bg-[#E5E4DE] text-[#8B937D] cursor-not-allowed' : 'bg-[#6DD58C] hover:bg-[#5bc279] text-[#1A2115] shadow-lg shadow-[#6DD58C]/20'}`}>
                {loading ? 'Analyzing Neural Network...' : 'Find Perfect Offset Match'}
              </button>

              {aiError && <div className="text-red-800 bg-red-100 p-4 rounded-xl mt-6 text-sm">{aiError}</div>}
              
              {recommendation && (
                <div className="mt-8 bg-[#1A2115] p-6 rounded-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-[#6DD58C] opacity-10 rounded-full blur-2xl"></div>
                   <span className="text-[#6DD58C] text-[10px] uppercase tracking-widest font-bold block mb-2 relative z-10">AI Match Found</span>
                   <p className="text-[#F4F3ED] font-light leading-relaxed relative z-10 text-sm">
                    {recommendation}
                   </p>
                </div>
              )}
          </div>
        </div>
      )}

      {/* PROJECT DISCOVERY TERMINAL (JUMPS TO MARKETPLACE) */}
      {credits && credits.length > 0 && (
        <div className="mt-10 pt-10 border-t border-[#E5E4DE]">
            <h4 className="text-xl font-['Montenegrin_Gothic_One'] font-bold text-[#1A2115] mb-3">Project Discovery Terminal</h4>
            <p className="text-xs text-[#8B937D] mb-4">Search for your recommended project and locate it on the exchange floor.</p>
            <input 
                type="text" 
                placeholder="Search projects by name or company..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F4F3ED] border border-[#E5E4DE] rounded-xl p-4 text-[#1A2115] focus:outline-none focus:border-[#6DD58C] mb-4 font-light hover:border-[#1A2115] transition-colors"
            />
            {searchQuery.trim() !== "" && (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {credits
                      .filter(c => c.isVerified && (c.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || c.companyName.toLowerCase().includes(searchQuery.toLowerCase())))
                      .map(proj => (
                        <div key={proj._id} className="p-4 bg-[#F4F3ED] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-[#E5E4DE] hover:border-[#6DD58C] transition-colors">
                            <div>
                                <h5 className="font-bold text-[#1A2115]">{proj.projectName}</h5>
                                <p className="text-xs text-[#8B937D]">{proj.companyName} • {proj.offsetAmount} Tons</p>
                            </div>
                            
                            {/* REDIRECT BUTTON */}
                            <button 
                                onClick={() => navigate(`/marketplace#${proj._id}`)}
                                className="flex-none w-full md:w-auto bg-[#1A2115] text-[#6DD58C] hover:bg-[#2C3524] px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors shadow-md text-center"
                            >
                                Locate in Exchange →
                            </button>
                        </div>
                    ))}
                    {credits.filter(c => c.isVerified && (c.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || c.companyName.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                        <p className="text-sm text-[#8B937D] p-4 text-center">No verified projects match your search.</p>
                    )}
                </div>
            )}
        </div>
      )}
    </div>
  );
};