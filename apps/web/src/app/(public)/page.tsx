import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Mail,
  Phone,
  Sparkles,
  Star,
} from "lucide-react";

const services = [
  ["House Cleaning", "Regular room, apartment, and full-home cleaning for Malindi households."],
  ["Office Cleaning", "Scheduled office cleaning for shops, clinics, rentals, and small businesses."],
  ["Move In / Out Cleaning", "Detailed cleaning before a move, after renovation, or between tenants."],
];

const process = [
  ["Choose Your Service", "Select cleaning, laundry, Airbnb turnover, or house-help placement."],
  ["Pick Your Schedule", "Share your date, location, and any access or room notes."],
  ["Confirm Your Booking", "The office assigns verified staff and confirms the final amount."],
  ["Enjoy A Spotless Space", "Track the visit, payment, rating, and follow-up from your portal."],
];

const plans = [
  ["Basic Cleaning", "300", ["Single room cleaning", "Standard surface cleaning", "Customer portal tracking"]],
  ["Standard Cleaning", "650", ["One-bedroom cleaning", "Kitchen and bathroom focus", "Assigned cleaner"]],
  ["Corporate Cleaning", "Quote", ["Office cleaning plans", "Recurring schedule", "Admin reconciliation"]],
  ["Premium Cleaning", "2,000", ["House-help placement", "Shortlist and screening", "Placement follow-up"]],
];

const posts = [
  ["The Difference Between Regular Cleaning And Deep Cleaning", "Cleaning Tips"],
  ["7 Signs Your Workspace Needs Professional Attention", "Office Cleaning"],
  ["How Smart Cleaning Services Are Changing Modern Homes", "Home Care"],
];

const processImages = [
  "https://images.pexels.com/photos/6195271/pexels-photo-6195271.jpeg?auto=compress&cs=tinysrgb&w=700",
  "https://images.pexels.com/photos/6197119/pexels-photo-6197119.jpeg?auto=compress&cs=tinysrgb&w=700",
  "https://images.pexels.com/photos/6195121/pexels-photo-6195121.jpeg?auto=compress&cs=tinysrgb&w=700",
  "https://images.pexels.com/photos/6196225/pexels-photo-6196225.jpeg?auto=compress&cs=tinysrgb&w=700",
];

const blogImages = [
  "https://images.pexels.com/photos/4239146/pexels-photo-4239146.jpeg?auto=compress&cs=tinysrgb&w=700",
  "https://images.pexels.com/photos/6196238/pexels-photo-6196238.jpeg?auto=compress&cs=tinysrgb&w=700",
  "https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=700",
];

export default function PublicHomePage() {
  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#071d3a]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-5 lg:px-0">
          <Link href="/" className="flex items-center gap-2 font-black text-[#071d3a]">
            <span className="grid h-7 w-7 place-items-center rounded bg-[#ffe600] text-xs">+</span>
            CLEANNA
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-600 md:flex">
            <Link href="/">Home</Link>
            <Link href="#about">About Us</Link>
            <Link href="#services">Pages</Link>
            <Link href="#testimonials">Testimonials</Link>
            <Link href="#blog">Blog</Link>
            <Link href="/book/service">Contact</Link>
          </nav>
          <a className="hidden rounded-full bg-[#071d3a] px-5 py-3 text-sm font-black text-white sm:inline-flex" href="tel:0141580500">
            Call 0141580500
          </a>
        </div>
      </header>

      <section className="bg-[#f3f6fb]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-0 lg:py-20">
          <div className="self-center">
            <p className="mb-4 text-sm font-bold text-slate-500">Trusted By 250+ Customers</p>
            <h1 className="max-w-xl text-balance text-5xl font-black leading-[1.02] tracking-[-0.025em] sm:text-6xl">
              A Cleaner Space Starts With People You Can Trust
            </h1>
            <p className="mt-6 max-w-lg leading-8 text-slate-600">
              We help busy households and growing businesses maintain cleaner, healthier spaces with reliable scheduling and trusted cleaning professionals.
            </p>
            <Link className="mt-7 inline-flex items-center rounded-full bg-[#ffe600] px-6 py-4 text-sm font-black text-[#071d3a]" href="/book/service">
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <div className="relative min-h-[510px] overflow-hidden rounded-sm bg-[#d8d2ff]">
            <div className="absolute left-10 top-10 h-[390px] w-[240px] overflow-hidden bg-white">
              <img className="h-full w-full object-cover" src="https://images.pexels.com/photos/9462206/pexels-photo-9462206.jpeg?auto=compress&cs=tinysrgb&w=700" alt="Smiling cleaner holding a spray bottle" />
            </div>
            <div className="absolute bottom-0 right-10 h-[390px] w-[245px] overflow-hidden bg-white">
              <img className="h-full w-full object-cover" src="https://images.pexels.com/photos/6195103/pexels-photo-6195103.jpeg?auto=compress&cs=tinysrgb&w=700" alt="Cleaner preparing a home service visit" />
            </div>
            <div className="absolute left-32 top-72 rounded bg-[#071d3a] px-4 py-3 text-sm font-black text-white shadow-sm">
              Jecilia Otieno<br /><span className="font-semibold text-white/70">Head Cleaner</span>
            </div>
            <div className="absolute right-20 top-80 rounded bg-[#071d3a] px-4 py-3 text-sm font-black text-white shadow-sm">
              Susan Akinyi<br /><span className="font-semibold text-white/70">Supervisor</span>
            </div>
            <div className="absolute right-8 top-10 max-w-[230px] text-sm leading-6 text-[#071d3a]">
              Our team uses safe, professional, and fast at-home supplies that help the team deliver reliable results every week.
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071d3a] text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:px-0">
          {["Window Cleaning", "Office Cleaning", "Pressure Washing", "Warehouse Cleaning"].map((item) => (
            <div key={item} className="flex items-center gap-3 font-black">
              <Sparkles className="h-5 w-5 text-[#ffe600]" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-0">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">About Us</p>
            <div>
              <h2 className="text-balance text-4xl font-black leading-tight">At Cleanna, We Believe A Clean Space Is Happy Space. With Years Of Experience In Residential & Commercial Cleaning</h2>
              <p className="mt-4 max-w-3xl leading-8 text-slate-600">
                Professional cleaning services for homes, offices, and commercial spaces. Keeping every space fresh, spotless, and comfortable across Malindi.
              </p>
              <Link className="mt-6 inline-flex items-center rounded-full bg-[#ffe600] px-5 py-3 text-sm font-black" href="/book/service">
                More About Us <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="overflow-hidden rounded-sm bg-[#f3f6fb]"><img className="h-64 w-full object-cover" src="https://images.pexels.com/photos/4107120/pexels-photo-4107120.jpeg?auto=compress&cs=tinysrgb&w=700" alt="Cleaner in a bright room" /></div>
            <div className="bg-[#f3f6fb] p-8"><p className="text-4xl font-black">120+</p><p className="mt-2 font-black">Professional Cleaners</p><p className="mt-3 leading-7 text-slate-600">Experienced and background-checked cleaners ready for homes and offices.</p></div>
            <div className="bg-[#f3f6fb] p-8"><p className="text-4xl font-black">10+</p><p className="mt-2 font-black">Years Experience</p><p className="mt-3 leading-7 text-slate-600">Reliable cleaning coordination for households, rentals, and businesses.</p></div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-[#f7f9fb] py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-0">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-end">
            <h2 className="text-balance text-4xl font-black leading-tight">Professional Cleaning Solutions For Every Space</h2>
            <p className="leading-8 text-slate-600">Customized cleaning services designed for homes, apartments, offices, and commercial spaces.</p>
          </div>
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {services.map(([title, text], index) => (
              <div key={title} className="grid gap-4 py-8 md:grid-cols-[80px_1fr_auto] md:items-center">
                <p className="font-black text-slate-400">0{index + 1}.</p>
                <div><h3 className="font-black">{title}</h3><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{text}</p></div>
                <Link href="/book/service" className="grid h-9 w-9 place-items-center rounded-full bg-[#071d3a] text-white"><ArrowRight className="h-4 w-4" /></Link>
              </div>
            ))}
          </div>
          <Link className="mt-8 inline-flex items-center rounded-full bg-[#ffe600] px-5 py-3 text-sm font-black" href="/book/service">See All Services <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-0">
          <div className="grid gap-6 lg:grid-cols-[0.58fr_1.42fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">How It Works</p>
              <h2 className="mt-4 text-4xl font-black leading-tight">Simple Cleaning Process In Just A Few Steps</h2>
              <p className="mt-4 leading-8 text-slate-600">Follow a fast process from service choice to confirmed visit.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {process.map(([title, text], index) => (
                <div key={title} className="space-y-4">
                  <p className="font-black text-slate-400">0{index + 1}</p>
                  <h3 className="font-black">{title}</h3>
                  <p className="text-sm leading-7 text-slate-600">{text}</p>
                  <img className="h-56 w-full object-cover" src={processImages[index]} alt={`${title} cleaning process`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071d3a] py-20 text-white">
        <div className="mx-auto max-w-6xl px-5 lg:px-0">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffe600]">What Makes Us Different</p>
            <h2 className="mt-3 text-balance text-4xl font-black">Reliable Cleaning Services Designed Around Your Needs</h2>
            <p className="mt-4 leading-8 text-white/70">We combine experienced cleaners, clear scheduling, and high-quality service standards to deliver a cleaner, fresher, and more comfortable environment.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {["01. Trusted Cleaning Professionals", "02. Flexible Scheduling Options", "03. Eco-Friendly Cleaning Products"].map((title) => (
              <div key={title} className="bg-white p-6 text-[#071d3a]"><BadgeCheck className="h-7 w-7" /><h3 className="mt-5 font-black">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">Reliable service standards for homes, offices, and rental spaces.</p><p className="mt-6 text-3xl font-black">10%</p></div>
            ))}
          </div>
          <div className="mt-10 text-center"><Link className="inline-flex rounded-full bg-[#ffe600] px-6 py-4 font-black text-[#071d3a]" href="/book/service">Get In Touch</Link></div>
        </div>
      </section>

      <section className="bg-[#f7f9fb] py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-0">
          <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Plans & Pricing</p><h2 className="mt-3 text-4xl font-black">Flexible Cleaning Plans For Every Space</h2></div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {plans.map(([name, price, features]) => (
              <div key={name as string} className="bg-white p-6"><h3 className="font-black">{name as string}</h3><p className="mt-4 text-sm text-slate-500">Starting at</p><p className="mt-1 text-4xl font-black">{price === "Quote" ? "Quote" : `Ksh ${price}`}</p><Link className="mt-5 inline-flex w-full justify-center rounded-full bg-[#ffe600] px-4 py-3 text-sm font-black" href="/book/service">Book Service</Link><ul className="mt-5 space-y-3 text-sm text-slate-600">{(features as string[]).map((feature) => <li key={feature} className="flex gap-2"><Check className="h-4 w-4 text-[#071d3a]" />{feature}</li>)}</ul></div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="bg-white py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-0">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Testimonials</p><h2 className="mt-3 text-4xl font-black">Trusted By Over 15k+ Satisfied Clients</h2><div className="mt-8 overflow-hidden"><img className="h-80 w-full object-cover" src="https://images.pexels.com/photos/4107112/pexels-photo-4107112.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Satisfied cleaning customer" /></div></div>
          <div className="grid gap-5 sm:grid-cols-2">
            {["Richard Thompson", "Celia Adams", "Emma Richardson", "Michael Foster"].map((name) => <div key={name} className="bg-[#f7f9fb] p-6"><div className="flex text-[#ffb800]"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></div><h3 className="mt-4 font-black">{name}</h3><p className="mt-3 text-sm leading-7 text-slate-600">The team arrived on time, worked carefully, and left the space ready for the day.</p></div>)}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9fb] py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-0">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">FAQ</p><h2 className="mt-3 text-4xl font-black">Everything You Need To Know About Our Cleaning Services</h2><img className="mt-8 h-72 w-full object-cover" src="https://images.pexels.com/photos/6195121/pexels-photo-6195121.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Cleaner mopping office floor" /></div>
          <div className="self-end rounded-sm bg-[#071d3a] p-4 text-white">
            {["What Cleaning Services Do You Offer?", "Are Your Cleaners Professionally Trained?", "Do You Bring Your Own Cleaning Supplies?", "Can I Schedule Recurring Cleaning Services?", "How Do I Book A Cleaning Service?"].map((q) => <div key={q} className="flex items-center justify-between border-b border-white/10 px-4 py-5 font-black last:border-b-0"><span>{q}</span><ChevronDown className="h-5 w-5" /></div>)}
          </div>
        </div>
      </section>

      <section id="blog" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-5 text-center lg:px-0"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">From Our Blog</p><h2 className="mt-3 text-4xl font-black">Our Latest News From Blog</h2><div className="mt-10 grid gap-5 text-left md:grid-cols-3">{posts.map(([title, tag], index) => <article key={title} className="bg-[#f7f9fb]"><img className="h-48 w-full object-cover" src={blogImages[index]} alt={title} /><div className="p-5"><p className="mb-3 w-fit rounded-full bg-[#ffe600] px-3 py-1 text-xs font-black">{tag}</p><h3 className="font-black leading-snug">{title}</h3></div></article>)}</div></div>
      </section>

      <section className="bg-white pb-20">
        <div className="mx-auto max-w-6xl bg-[#071d3a] p-8 text-white lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div><h2 className="text-4xl font-black">Ready For A Cleaner, Smarter Space?</h2><p className="mt-4 leading-8 text-white/72">Request the team, confirm the details, and keep every visit visible from booking to follow-up.</p></div>
            <div className="rounded bg-[#ffe600] p-3"><Link href="/book/service" className="flex items-center justify-between rounded-full bg-[#ffe600] px-4 py-3 font-black text-[#071d3a]">Cleaning That Works Around You <span className="rounded-full bg-[#071d3a] px-4 py-2 text-white">Book Your Cleaning</span></Link></div>
          </div>
        </div>
      </section>

      <footer className="bg-[#071d3a] py-14 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-4 lg:px-0">
          <div><p className="font-black text-[#ffe600]">+ CLEANNA</p><p className="mt-4 text-sm leading-7 text-white/70">Professional cleaning and house-help services for Malindi homes and businesses.</p></div>
          <div><h3 className="font-black">Company</h3><p className="mt-4 space-y-2 text-sm text-white/70">About Us<br />Services<br />Our Cleaners<br />Testimonials</p></div>
          <div><h3 className="font-black">Services</h3><p className="mt-4 space-y-2 text-sm text-white/70">Residential Cleaning<br />Commercial Cleaning<br />House Help Placement<br />Move Out Cleaning</p></div>
          <div><h3 className="font-black">Newsletter</h3><div className="mt-4 flex rounded-full bg-white p-1"><input suppressHydrationWarning className="min-w-0 flex-1 rounded-full px-4 text-sm text-[#071d3a]" placeholder="Your email address" /><button className="rounded-full bg-[#ffe600] px-4 text-sm font-black text-[#071d3a]">Submit</button></div><p className="mt-5 flex items-center gap-2 text-sm text-white/70"><Phone className="h-4 w-4" />0141580500</p><p className="mt-2 flex items-center gap-2 text-sm text-white/70"><Mail className="h-4 w-4" />info@malindicleaning.co.ke</p></div>
        </div>
      </footer>
    </main>
  );
}
