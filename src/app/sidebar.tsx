const links = [
  { name: "Dashboard", href: "/" },
  { name: "Carte", href: "/map" },
]

export default function Sidebar() {
  return (
    <div>
      {links.map((link) => (
        <a key={link.href} href={link.href}>
          {link.name}
        </a>
      ))}
    </div>
  )
}