import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-rose-300 via-pink-300 to-orange-300 flex items-center justify-center p-6 md:p-10">
      <div className="relative">
        <div className="w-[300px] md:w-[360px] rounded-[46px] bg-black p-3 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <div className="rounded-[38px] bg-[#eceef2] min-h-[640px] md:min-h-[720px] overflow-hidden border border-black/20 flex flex-col">
            <div className="pt-12 pb-8 flex flex-col items-center gap-4">
              <img
                src="https://i.pravatar.cc/140?img=5"
                alt="Customer service avatar"
                className="h-24 w-24 rounded-full object-cover border-4 border-white shadow"
              />
              <h1 className="text-5xl leading-tight text-slate-900 text-center font-medium tracking-tight">
                Customer
                <br />
                Service
              </h1>
            </div>

            <div className="flex-1 px-4 md:px-5 pb-8 space-y-6 text-[17px] md:text-[19px] text-slate-700">
              <div className="relative bg-white rounded-2xl p-5 shadow-sm">
                <p>What is the expected duration for the shipment?</p>
                <span className="absolute right-4 bottom-3 text-cyan-400 text-xl">✓✓</span>
                <span className="absolute -right-3 top-1/2 -translate-y-1/2 h-0 w-0 border-y-[12px] border-y-transparent border-l-[14px] border-l-white" />
              </div>

              <div className="relative bg-rose-100 rounded-2xl p-5 shadow-sm text-slate-800">
                <p>Your order will be delivered within 4-6 business days from the payment date.</p>
                <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-0 w-0 border-y-[12px] border-y-transparent border-r-[14px] border-r-rose-100" />
              </div>

              <div className="relative bg-white rounded-2xl p-5 shadow-sm">
                <p>thanks for the speedy reply. Have a great day!</p>
                <span className="absolute right-4 bottom-3 text-cyan-400 text-xl">✓✓</span>
                <span className="absolute -right-3 top-1/2 -translate-y-1/2 h-0 w-0 border-y-[12px] border-y-transparent border-l-[14px] border-l-white" />
              </div>
            </div>

            <div className="py-6 text-center text-slate-900 text-4xl font-medium tracking-tight">Questions &amp; Answers</div>
          </div>
        </div>

        <img
          src="https://i.pravatar.cc/90?img=12"
          alt="User avatar"
          className="hidden md:block absolute -right-16 top-72 h-20 w-20 rounded-full border-[6px] border-white object-cover shadow-lg"
        />
        <img
          src="https://i.pravatar.cc/90?img=47"
          alt="User avatar"
          className="hidden md:block absolute -left-16 top-[420px] h-20 w-20 rounded-full border-[6px] border-white object-cover shadow-lg"
        />
        <img
          src="https://i.pravatar.cc/90?img=12"
          alt="User avatar"
          className="hidden md:block absolute -right-16 top-[560px] h-20 w-20 rounded-full border-[6px] border-white object-cover shadow-lg"
        />
      </div>
    </div>
  );
};

export default App;
