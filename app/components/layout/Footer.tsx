import Link from 'next/link'
import Image from 'next/image'

const footerLinks = [
  { href: '/', label: 'Beranda' },
  { href: '/cek-kas', label: 'Cek Kas' },
  { href: '/transparansi', label: 'Transparansi' },
  { href: '/pengumuman', label: 'Pengumuman' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border-subtle bg-surface-base">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_0.8fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="brand-logo-frame h-10 w-10">
                <Image
                  src="/rimayah-logo.jpg"
                  alt="Logo Sa'ad Al-Furusiyah"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <span className="block font-heading text-lg text-text-primary">Sa&apos;ad Al-Furusiyah</span>
                <span className="text-[10px] uppercase text-text-tertiary">Portal Keuangan</span>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-6 text-text-tertiary">
              Ruang publik untuk membaca posisi kas, status iuran, dan pengumuman resmi organisasi.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase text-text-tertiary mb-4">Navigasi</h3>
            <ul className="space-y-2">
              {footerLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-emerald-bright transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase text-text-tertiary mb-4">Operasional</h3>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="flex justify-between gap-4 border-b border-border-subtle pb-3">
                <span>Iuran bulanan</span>
                <span className="font-mono-num text-text-primary">Rp 8.000</span>
              </li>
              <li className="flex justify-between gap-4 border-b border-border-subtle pb-3">
                <span>Verifikasi</span>
                <span className="text-text-primary">Bendahara</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Akses anggota</span>
                <span className="text-text-primary">Publik</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-tertiary">
            &copy; {currentYear} Sa&apos;ad Al-Furusiyah. Seluruh hak dilindungi.
          </p>
          <p className="text-xs text-text-disabled">
            Dikembangkan &amp; Didukung oleh{' '}
            <a
              href="https://fihla.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary transition-colors hover:text-emerald-bright"
            >
              PT FIHLA INOVASI UTAMA
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
