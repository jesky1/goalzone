import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Database, Cookie, Lock, Users, Bell, Mail, Globe } from 'lucide-react';

// ─── SEO Metadata ─────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://goalzone.vercel.app';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description: 'Kebijakan privasi GOALZONE — penjelasan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.',
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
};

// ─── Static privacy sections ─────────────────────────────────

const sections = [
  {
    id: 'pengantar',
    icon: Shield,
    title: 'Pendahuluan',
    content: [
      'GOALZONE ("kami", "kita", atau "Platform") berkomitmen untuk melindungi privasi pengguna. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi Anda saat menggunakan layanan kami, termasuk website, aplikasi, dan layanan terkait.',
      'Dengan mengakses atau menggunakan GOALZONE, Anda menyetujui praktik yang dijelaskan dalam Kebijakan Privasi ini. Jika Anda tidak setuju dengan kebijakan ini, mohon untuk tidak menggunakan layanan kami.',
    ],
  },
  {
    id: 'data-dikumpulkan',
    icon: Database,
    title: 'Informasi yang Kami Kumpulkan',
    content: [
      'Kami mengumpulkan beberapa jenis informasi untuk menyediakan dan meningkatkan layanan kami:',
      'Informasi yang Anda berikan secara langsung: nama pengguna, alamat email, avatar, dan preferensi bahasa saat mendaftar akun.',
      'Informasi yang dikumpulkan secara otomatis: alamat IP, jenis browser, sistem operasi, halaman yang dikunjungi, waktu akses, dan data perangkat melalui cookies dan teknologi serupa.',
      'Data penggunaan: riwayat pencarian, artikel yang dibaca, pertandingan yang di-bookmark, dan preferensi liga favorit.',
    ],
  },
  {
    id: 'penggunaan-data',
    icon: Eye,
    title: 'Penggunaan Informasi',
    content: [
      'Informasi yang kami kumpulkan digunakan untuk tujuan berikut:',
      'Menyediakan, mengoperasikan, dan memelihara layanan GOALZONE termasuk fitur live score, klasemen, dan berita sepak bola.',
      'Mempersonalisasi pengalaman pengguna dengan menampilkan konten dan rekomendasi yang relevan sesuai minat Anda.',
      'Mengirimkan notifikasi tentang pertandingan, hasil skor, dan berita transfer sesuai preferensi Anda.',
      'Menganalisis tren penggunaan untuk meningkatkan kualitas layanan dan mengembangkan fitur baru.',
      'Mendeteksi, mencegah, dan menangani masalah teknis atau aktivitas yang melanggar ketentuan layanan.',
    ],
  },
  {
    id: 'cookies',
    icon: Cookie,
    title: 'Cookies dan Teknologi Pelacakan',
    content: [
      'GOALZONE menggunakan cookies dan teknologi pelacakan serupa untuk:',
      'Mengingat preferensi Anda seperti tema tampilan dan liga favorit.',
      'Menganalisis lalu lintas website untuk memahami bagaimana pengguna berinteraksi dengan konten kami.',
      'Menyediakan fitur personalisasi dan rekomendasi konten yang lebih akurat.',
      'Anda dapat mengatur preferensi cookies melalui pengaturan browser Anda. Menonaktifkan cookies tertentu dapat mempengaruhi fungsionalitas beberapa fitur.',
    ],
  },
  {
    id: 'perlindungan',
    icon: Lock,
    title: 'Keamanan Data',
    content: [
      'Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi informasi pribadi Anda dari akses yang tidak sah, perubahan, pengungkapan, atau penghancuran.',
      'Langkah-langkah keamanan kami mencakup enkripsi data (SSL/TLS), kontrol akses berbasis peran, audit log, dan pemantauan keamanan berkala.',
      'Meskipun kami berusaha melindungi data Anda, tidak ada metode transmisi melalui internet atau penyimpanan elektronik yang sepenuhnya aman. Kami tidak dapat menjamin keamanan mutlak.',
    ],
  },
  {
    id: 'pembagian-data',
    icon: Users,
    title: 'Pembagian Data kepada Pihak Ketiga',
    content: [
      'Kami tidak menjual informasi pribadi Anda kepada pihak ketiga. Namun, kami dapat membagikan data dalam situasi berikut:',
      'Penyedia layanan: kami membagikan data dengan penyedia hosting, analitik, dan layanan pendukung yang membantu kami mengoperasikan Platform.',
      'Kepatuhan hukum: kami dapat mengungkapkan informasi jika diwajibkan oleh hukum, proses hukum, atau permintaan pemerintah.',
      'Perlindungan hak: kami dapat membagikan data untuk melindungi hak, properti, atau keselamatan GOALZONE, pengguna kami, atau pihak lain.',
    ],
  },
  {
    id: 'hak-pengguna',
    icon: Bell,
    title: 'Hak Pengguna',
    content: [
      'Sebagai pengguna GOALZONE, Anda memiliki hak untuk:',
      'Mengakses dan melihat informasi pribadi yang kami simpan tentang Anda melalui pengaturan akun.',
      'Memperbarui atau memperbaiki data yang tidak akurat atau tidak lengkap.',
      'Menghapus akun dan data pribadi Anda dengan menghubungi tim kami.',
      'Menolak pemrosesan data untuk tujuan pemasaran atau personalisasi.',
      'Meminta salinan data pribadi Anda dalam format yang dapat dibaca mesin.',
    ],
  },
  {
    id: 'kontak',
    icon: Mail,
    title: 'Hubungi Kami',
    content: [
      'Jika Anda memiliki pertanyaan, kekhawatiran, atau permintaan terkait Kebijakan Privasi ini atau praktik data kami, silakan hubungi:',
      'Email: privacy@goalzone.id',
      'Website: goalzone.id/kontak',
      'Kami akan merespons permintaan Anda dalam waktu 14 hari kerja sesuai dengan ketentuan peraturan perlindungan data yang berlaku.',
    ],
  },
];

// ─── Last Updated ─────────────────────────────────────────────

const LAST_UPDATED = '1 Juli 2025';

// ─── Page Component ──────────────────────────────────────────

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-deep-900">
      {/* ─── Decorative background elements ─────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-neon/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-emerald-500/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-deep-900/70 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-neon transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Kembali ke Beranda</span>
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
              <Globe className="w-3.5 h-3.5" />
              <span>goalzone.id</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ───────────────────────────────────── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Title */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neon/[0.08] border border-neon/20 mb-5 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-neon" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-3">
            <span className="neon-text">Kebijakan Privasi</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            Terakhir diperbarui: <span className="text-white/70 font-medium">{LAST_UPDATED}</span>
          </p>
        </div>

        {/* Glassmorphism Container */}
        <div className="glass-card overflow-hidden">
          {/* Top neon line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-neon/60 to-transparent" />

          <div className="p-5 sm:p-8 lg:p-10 space-y-8 sm:space-y-10">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <section key={section.id}>
                  {/* Section Header */}
                  <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neon/[0.06] border border-neon/15 flex items-center justify-center mt-0.5 shadow-[0_0_12px_rgba(0,240,255,0.05)]">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-neon/80" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                        <span className="text-neon/40 font-mono text-xs">{String(index + 1).padStart(2, '0')}</span>
                        <span className="neon-text">{section.title}</span>
                      </h2>
                    </div>
                  </div>

                  {/* Section Content */}
                  <div className="space-y-3 ml-0 sm:ml-14">
                    {section.content.map((paragraph, pIdx) => (
                      <p
                        key={pIdx}
                        className={`text-sm sm:text-[15px] leading-relaxed text-gray-400 dark:text-gray-400
                          ${pIdx === 0 ? '' : 'pl-0 border-l-2 border-white/[0.04] pl-4 ml-0 sm:ml-0'}`}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Separator (except last) */}
                  {index < sections.length - 1 && (
                    <div className="mt-8 sm:mt-10 border-b border-white/[0.04]" />
                  )}
                </section>
              );
            })}
          </div>

          {/* Bottom neon line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-neon/30 to-transparent" />
        </div>

        {/* ─── Footer Actions ────────────────────────────────── */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] sm:text-xs text-muted-foreground/40 text-center sm:text-left">
            &copy; {new Date().getFullYear()} GOALZONE. Semua hak dilindungi.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                bg-neon/[0.06] text-neon border border-neon/20
                hover:bg-neon/[0.1] hover:border-neon/30
                hover:shadow-[0_0_20px_rgba(0,240,255,0.1)]
                transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Beranda
            </Link>
          </div>
        </div>
      </main>

      {/* ─── Minimal Footer ─────────────────────────────────── */}
      <footer className="border-t border-white/[0.03] bg-deep-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground/30">
            <span>GOALZONE &mdash; Portal Berita Sepak Bola</span>
            <div className="flex items-center gap-3">
              <Link href="/" className="hover:text-neon/60 transition-colors">Beranda</Link>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
              <Link href="/privacy-policy" className="hover:text-neon/60 transition-colors">Privasi</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
