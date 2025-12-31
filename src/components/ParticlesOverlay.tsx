export const ParticlesOverlay = ({ premiereActive, finaleActive }: { premiereActive: boolean; finaleActive: boolean }) => {
  return (
    <>
      <div className="orb cyan" />
      <div className="orb purple" />
      <div className="orb amber" />
      <div className="beam" />
      <div className="scanlines" />
      <div className="grid-overlay" />
      <div className="noise-overlay" />
      {premiereActive && <div className="premiere-rings" />}
      {premiereActive && <div className="energy-lines" />}
      {finaleActive && <div className="finale-flare" />}
    </>
  )
}
