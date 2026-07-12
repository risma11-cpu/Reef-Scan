import { useRef, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from '../components/navbar'
import './home.css'

gsap.registerPlugin(ScrollTrigger)

const kondisi = [
  { key: 'healthy', label: 'Sehat', labelEn: 'Healthy', desc: 'Karang dengan jaringan dan pigmen warna utuh, tanda zooxanthellae masih bekerja normal.', color: '#2ecc8f', img: '/images/healthy.jpg' },
  { key: 'bleached', label: 'Memutih', labelEn: 'Bleached', desc: 'Karang memutih karena melepaskan alga simbiosisnya akibat stres suhu air yang meningkat.', color: '#f4c74e', img: '/images/bleached.png' },
  { key: 'dead', label: 'Mati', labelEn: 'Dead', desc: 'Jaringan karang sudah tidak ada, menyisakan rangka kalsium karbonat.', color: '#8fa0ab', img: '/images/dead.png' },
  { key: 'algae', label: 'Berlumut', labelEn: 'Algae', desc: 'Permukaan karang didominasi pertumbuhan alga berlebih akibat penurunan kualitas air.', color: '#4aab5f', img: '/images/algae.jpg' },
]


const Home = ({ user, logout }) => {
  const heroRef = useRef(null)
  const heroBgRef = useRef(null)
  const ctaBgRef = useRef(null)
  const cardsRef = useRef([])
  const cardImgRef = useRef([])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Animasi parallax untuk video background
// if (heroBgRef.current) {
//   gsap.to(heroBgRef.current, {
//     yPercent: 25,
//     ease: 'none',
//     scrollTrigger: {
//       trigger: heroRef.current.querySelector('.hero-section'),
//       start: 'top top',
//       end: 'bottom top',
//       scrub: true,
//     },
//   })
// }
      if (heroBgRef.current) {
        gsap.to(heroBgRef.current, {
          yPercent: 25,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current.querySelector('.hero-section'),
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })
      }

      if (ctaBgRef.current) {
        gsap.to(ctaBgRef.current, {
          yPercent: 20,
          ease: 'none',
          scrollTrigger: {
            trigger: ctaBgRef.current.closest('.cta-section'),
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        })
      }

      cardsRef.current.forEach((card, i) => {
        if (!card) return
        gsap.fromTo(
          card,
          { y: 80, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            delay: i * 0.12,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 85%' },
          }
        )
      })

      cardImgRef.current.forEach((wrap, i) => {
        if (!wrap) return
        const img = wrap.querySelector('img')
        if (!img) return

        const tl = gsap.timeline({
          scrollTrigger: { trigger: wrap, start: 'top 85%' },
        })

        tl.fromTo(
          wrap,
          { clipPath: 'inset(0 0 100% 0)' },
          {
            clipPath: 'inset(0 0 0% 0)',
            duration: 0.9,
            delay: i * 0.12,
            ease: 'power4.inOut',
          }
        ).fromTo(
          img,
          { scale: 1.35 },
          { scale: 1, duration: 1.1, ease: 'power3.out' },
          '<'
        )
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <div className="home" ref={heroRef}>
      <Navbar user={user} logout={logout} />

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-bg">
          {/* 
            Gunakan class "hero-bg-img" agar video mewarisi gaya CSS yang sama dengan gambar sebelumnya.
            Ditambahkan 'poster' sebagai gambar cadangan saat video sedang dimuat.
          */}
          <video 
            ref={heroBgRef}
            autoPlay 
            loop 
            muted 
            playsInline 
            className="hero-bg-img"
            poster="/images/foto-1.jpg"
          >
            <source src="/images/coral_reef.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="hero-overlay" />
        </div>

        {/* Tulisan REEF SCAN gede di tengah */}
        <div className="hero-title-center">
          <motion.span
            className="hero-eyebrow-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Sistem Klasifikasi AI · YOLOv8
          </motion.span>
          <motion.h1
            className="hero-big-title"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
          >
            Reef Scan
          </motion.h1>
          <motion.p
            className="hero-sub"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            Upload foto terumbu karang dan dapatkan hasil klasifikasi kondisinya secara otomatis menggunakan model deep learning YOLOv8 dengan akurasi 98%.
          </motion.p>
          <motion.div
            className="hero-actions-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <Link to="/analyze" className="btn-hero-primary">Mulai Analisis →</Link>
            <Link to="/register" className="btn-hero-outline">Buat Akun</Link>
          </motion.div>
        </div>

        <div className="hero-scroll-hint">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>↓</motion.div>
        </div>
      </section>


      {/* KONDISI KARANG */}
      <section className="kondisi-section">
        <div className="section-header" style={{ maxWidth: '1100px', margin: '0 auto 64px' }}>
  <h2>Kondisi Terumbu Karang</h2>
  <span className="section-eyebrow">4 Kelas yang Dikenali Model</span>
  <p>Model YOLOv8 kami mampu mengklasifikasikan foto terumbu karang ke dalam empat kategori kondisi secara otomatis.</p>
</div>
        <div className="kondisi-grid">
          {kondisi.map((k, i) => (
            <div key={k.key} className="kondisi-card" ref={el => cardsRef.current[i] = el} style={{ '--accent': k.color }}>
              <div className="kondisi-img-wrap" ref={el => cardImgRef.current[i] = el}>
                <img src={k.img} alt={k.label} className="kondisi-img" />
              </div>
              <div className="kondisi-dot" />
              <div className="kondisi-label-en">{k.labelEn}</div>
              <h3>{k.label}</h3>
              <p>{k.desc}</p>
            </div>
          ))}
        </div>
      </section>
{/* CTA SECTION - FIXED WITH VIDEO BACKGROUND */}
      <section className="cta-section glass-cta">
        <div className="cta-bg">
          <video 
            ref={ctaBgRef}
            autoPlay 
            loop 
            muted 
            playsInline 
            className="cta-bg-video"
            poster="/images/foto-1.jpg"
            style={{
              width: '100%',
              height: '130%',
              objectFit: 'cover',
              position: 'absolute',
              top: '-15%',
              left: 0,
              willChange: 'transform'
            }}
          >
            <source src="/images/coral_reef.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="cta-overlay" />
        </div>
        <div className="cta-content">
          <h2>Mulai Analisis Sekarang</h2>
          <p>Upload foto terumbu karang dan dapatkan hasil klasifikasi dalam hitungan detik.</p>
          <Link to={user ? '/analyze' : '/register'} className="btn-cta">
            {user ? 'Pergi ke Analisis →' : 'Daftar Gratis →'}
          </Link>
        </div>
      </section>
       
        {/* MODERN STRUCTURED FOOTER */}
      <footer className="footer-modern">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <h2 className="footer-logo">Reef Scan</h2>
              <p>Platform analisis terumbu karang berbasis AI untuk mendukung konservasi laut global.</p>
            </div>
            
            <div className="footer-links-grid">
              <div className="footer-col">
                <h4>Navigasi</h4>
                <ul>
                  <li><Link to="/">Beranda</Link></li>
                  <li><Link to="/analyze">Analisis AI</Link></li>
                  <li><Link to="/about">Tentang Kami</Link></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Teknologi</h4>
                <ul>
                  <li><a href="#">YOLOv8s-cls</a></li>
                  <li><a href="#">Deep Learning</a></li>
                  <li><a href="#">Roboflow Dataset</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Kontribusi</h4>
                <ul>
                  <li><strong>Universitas Jabal Ghafur</strong></li>
                  <li>Mahasiswa Teknik Informatika</li>
                  <li>Pecinta Laut Indonesia</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-copyright">
              <p>© 2026 Reef Scan. All rights reserved.</p>
            </div>
            <div className="footer-meta">
              <span className="status-tag status-healthy">Sehat</span>
              <span className="status-sep">·</span>
              <span className="status-tag status-bleached">Memutih</span>
              <span className="status-sep">·</span>
              <span className="status-tag status-dead">Mati</span>
              <span className="status-sep">·</span>
              <span className="status-tag status-algae">Berlumut</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
