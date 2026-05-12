import React, { useState, useRef, useEffect } from 'react';
import { Message, CampusLocation } from './types';
import { processQuery } from './services/ragService';
import { ChatMessage } from './components/ChatMessage';
import { InputArea } from './components/InputArea';
import { CampusMap } from './components/CampusMap';
import { LiveAPI } from './components/LiveAPI';
import { CAMPUS_DATA } from './data/campusData';
import { supabase } from './utils/supabase';
import { MapPin, Compass, Mic, Search, Map, ArrowLeft, Menu, Send } from 'lucide-react';

// Simple ID generator
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [startInput, setStartInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: "Welcome to OAU! I can help you find the Senate Building, Moremi Hall, or check the latest news.",
      timestamp: Date.now()
    }
  ]);

  const [locations, setLocations] = useState<CampusLocation[]>(CAMPUS_DATA.locations);
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeDestination, setActiveDestination] = useState<CampusLocation | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'chat' | 'map'>('chat');
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab]);

  useEffect(() => {
    async function fetchLocations() {
      const { data } = await supabase.from('Location').select('*');
      if (data && data.length > 0) {
        setLocations(data.map(l => ({
          id: l.id,
          name: l.name,
          aliases: l.aliases,
          type: l.type as any,
          description: l.description,
          coords: { x: l.coordsX, y: l.coordsY },
          lat: l.lat ?? undefined,
          lng: l.lng ?? undefined,
          imageUrl: l.imageUrl ?? undefined
        })));
      }
    }
    fetchLocations();
  }, []);

  // Real-time Geolocation Hook
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setUserLocation({ lat: 7.5197, lng: 4.5190 }); // Default fallback OAU center
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError(null);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Using default campus center.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable. Using default campus center.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown location error occurred.");
            break;
        }
        // Fallback to default coordinating so the map doesn't break
        if (!userLocation) {
          setUserLocation({ lat: 7.5197, lng: 4.5190 });
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const processUserRequest = async (text: string) => {
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const { answer, context, groundingMetadata, suggestedLocationId } = await processQuery(text, messages, locations, userLocation);

      if (suggestedLocationId) {
          const loc = locations.find(l => l.id === suggestedLocationId);
          if (loc) {
              setActiveDestination(loc);
          }
      }

      const botMsg: Message = {
        id: generateId(),
        role: 'bot',
        content: answer,
        timestamp: Date.now(),
        retrievedContext: context,
        groundingMetadata,
        suggestedLocationId
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: generateId(),
        role: 'bot',
        content: "System Error: Unable to process request.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (loc: CampusLocation | null) => {
    setActiveDestination(loc);
  };

  const handleGetDirections = (loc: CampusLocation) => {
    setActiveDestination(loc);
    setActiveTab('chat');
    processUserRequest(`Tell me about ${loc.name} and how to get there.`);
  };

  const clearHistory = () => {
    setMessages([]);
    setShowClearConfirm(false);
  };

  const handleLiveTranscript = (role: 'user' | 'bot', text: string) => {
    const msg: Message = {
      id: generateId(),
      role,
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, msg]);
  };

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 flex flex-col bg-[#fcfdfd] font-sans overflow-hidden">
        {/* Header */}
        <header className="px-6 md:px-8 py-4 md:py-6 flex items-center shrink-0 w-full bg-white z-50 border-b border-gray-100 shadow-sm relative">
          <div className="flex items-center gap-3">
            {/* Header Logo */}
            <img src="/logo.png" alt="UniNav Logo" className="w-10 h-10 md:w-11 md:h-11 rounded-full shadow-sm" />
            <span className="text-xl md:text-2xl font-bold text-blue-600 tracking-wide">UniNav</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-5 md:-mt-20 overflow-y-auto pb-24 md:pb-0">
          
          {/* Center Logo */}
          <img src="/logo.png" alt="UniNav Large Logo" className="w-[56px] h-[56px] md:w-[72px] md:h-[72px] rounded-full shadow-md mb-6 md:mb-8 shrink-0" />

          <h1 className="text-[26px] sm:text-[32px] md:text-4xl font-semibold text-gray-800 mb-3 md:mb-4 text-center leading-tight md:tracking-tight max-w-[320px] md:max-w-none">
             <span className="md:hidden">Ask for directions or explore<br/>campus locations</span>
             <span className="hidden md:inline">Ask for directions or explore campus locations</span>
          </h1>
          <p className="text-gray-500 text-[13px] sm:text-[15px] md:text-base mb-8 md:mb-10 text-center font-medium max-w-[360px] md:max-w-none leading-relaxed">
             Get instant help navigating OAU campus with AI-powered assistance
          </p>

          {/* Search Bar - Static on Desktop, Absolute Bottom on Mobile */}
          <div className="w-full max-w-3xl z-10 absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#fcfdfd] via-[#fcfdfd] to-transparent md:static md:bg-none md:p-0 md:bg-transparent md:mb-12">
            <div className="relative flex items-center w-full h-[54px] md:h-14 rounded-full border border-gray-200 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] md:shadow-sm md:hover:shadow px-5 md:px-6">
              <input
                 type="text"
                 placeholder="Enter a destination or ask about a location..."
                 className="w-full h-full bg-transparent outline-none text-gray-700 placeholder-gray-400 text-[16px] md:text-[15px]"
                 value={startInput}
                 onChange={(e) => setStartInput(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && startInput.trim()) {
                     setHasStarted(true);
                     processUserRequest(startInput.trim());
                   }
                 }}
              />
              <button 
                 className="absolute right-1.5 md:right-2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shrink-0 shadow-sm md:shadow-none"
                 onClick={() => {
                   if (startInput.trim()) {
                     setHasStarted(true);
                     processUserRequest(startInput.trim());
                   } else {
                     setIsLiveOpen(true);
                   }
                 }}
              >
                 {startInput.trim() ? <Send className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} /> : <Mic className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />}
              </button>
            </div>
          </div>

          {/* Action Cards */}
          <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
            {[
              { icon: Compass, title: "Find a Route", desc: "Get directions to any location on campus", req: "I need directions" },
              { icon: Search, title: "Search Landmarks", desc: "Find buildings, facilities, and key locations", req: "Show me all campus locations" },
              { icon: MapPin, title: "Ask About a Place", desc: "Get details about any campus location", req: "Can you tell me about a specific place on campus?" },
              { icon: Map, title: "View Map", desc: "Explore the campus map and routes", req: "" }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setHasStarted(true);
                    if (card.title === "View Map") {
                      setActiveTab('map');
                    } else {
                      processUserRequest(card.req);
                    }
                  }}
                  className="flex flex-col text-left p-4 md:p-5 rounded-[14px] md:rounded-2xl bg-white border border-gray-100 md:shadow-sm md:hover:shadow-md md:hover:border-gray-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all active:scale-[0.98] group"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full md:rounded-xl bg-blue-50/80 md:bg-blue-50 md:border md:border-blue-100 flex items-center justify-center mb-3 md:mb-4 text-blue-500 shrink-0 md:group-hover:scale-110 md:transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-[13px] md:text-[15px] mb-1 md:mb-1.5 leading-tight">{card.title}</h3>
                  <p className="text-[10px] md:text-sm text-gray-400 md:text-gray-500 leading-[1.4] md:leading-relaxed font-medium">{card.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Popular Searches */}
          <div className="flex flex-col items-center w-full max-w-4xl mb-4 md:mb-0">
            <h4 className="text-[13px] text-gray-500 md:text-gray-400 mb-3 md:mb-4 font-medium">Popular searches:</h4>
            <div className="flex flex-wrap justify-center gap-2 md:gap-2.5">
              {['Library', 'Sports Complex', 'Health Center', 'Student Union', 'Computer Science Dept'].map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setHasStarted(true);
                    processUserRequest(`Where is the ${term.toLowerCase()}?`);
                  }}
                  className="px-5 md:px-6 py-2.5 rounded-full border border-gray-100 md:shadow-sm shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] bg-white text-[12px] md:text-[13px] font-medium text-gray-600 hover:border-gray-200 md:hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="h-[60px] md:h-16 bg-white border-b border-gray-100 flex justify-between items-center px-4 shrink-0 shadow-sm z-10 transition-all">
          <div className="flex items-center gap-4">
             <button onClick={() => {
                 if (activeTab === 'map') setActiveTab('chat');
                 else setHasStarted(false);
             }} className="text-gray-400 hover:text-gray-600 transition-colors p-1" title={activeTab === 'map' ? 'Back to Chat' : 'Back to Home'}>
                 <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="flex items-center gap-3">
                 <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-full shadow-sm shrink-0" />
                 <div className="flex flex-col">
                     <h1 className="text-gray-800 font-semibold text-[15px] leading-tight">
                         {activeTab === 'map' ? 'Campus Map' : 'OAU Campus Guide'}
                     </h1>
                     <span className="text-[11px] text-gray-400 font-medium mt-0.5">
                         {activeTab === 'map' ? 'Obafemi Awolowo University' : 'Online • Always here to help'}
                     </span>
                 </div>
             </div>
          </div>
          {activeTab !== 'map' && (
              <button 
                onClick={() => setActiveTab('map')} 
                className="text-gray-400 hover:text-blue-600 p-2 transition-colors mr-2"
                title="Open Campus Map"
              >
                <Map className="w-5 h-5" />
              </button>
          )}
          {activeTab === 'map' && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="text-gray-500 hover:text-gray-800 p-2 transition-colors mr-2 md:hidden"
                title="Open Locations"
              >
                <Menu className="w-6 h-6" />
              </button>
          )}
      </header>

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Clear History</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to clear your chat history? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={clearHistory}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {locationError && (
          <div className="bg-amber-100 text-amber-800 text-xs px-4 py-2 z-20 flex justify-between items-center shadow-sm relative">
            <span>{locationError}</span>
            <button onClick={() => setLocationError(null)} className="ml-2 font-bold hover:text-amber-900">&times;</button>
          </div>
        )}
        {activeTab === 'map' ? (
            <div className="absolute inset-0 flex flex-col">
                <CampusMap 
                    locations={locations} 
                    onLocationSelect={handleLocationSelect}
                    onGetDirections={handleGetDirections}
                    userLocation={userLocation}
                    activeDestination={activeDestination}
                    isSidebarOpen={isSidebarOpen}
                    onCloseSidebar={() => setIsSidebarOpen(false)}
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                />
            </div>
        ) : (
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 pb-20">
                    <div className="w-full max-w-4xl mx-auto flex flex-col pt-4">
                        {messages.map(msg => (
                            <ChatMessage 
                                key={msg.id} 
                                message={msg} 
                                onViewMap={() => {
                                    if (msg.suggestedLocationId) {
                                        const loc = locations.find(l => l.id === msg.suggestedLocationId);
                                        if (loc) {
                                            setActiveDestination(loc);
                                            setActiveTab('map');
                                        }
                                    }
                                }}
                            />
                        ))}
                        {isLoading && (
                            <div className="bg-white p-3 rounded-lg border border-gray-200 self-start inline-block shadow-sm">
                                 <p className="text-gray-400 text-xs animate-pulse">Thinking...</p>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                <div className="shrink-0">
                    <InputArea 
                        onSend={processUserRequest} 
                        onStartLive={() => setIsLiveOpen(true)}
                        isLoading={isLoading} 
                        voiceMode={true}
                    />
                </div>
            </div>
        )}
      </main>

      {/* Live API Modal */}
      {isLiveOpen && (
        <LiveAPI 
            visible={isLiveOpen} 
            onClose={() => setIsLiveOpen(false)}
            onTranscript={handleLiveTranscript}
        />
      )}


    </div>
  );
};

export default App;