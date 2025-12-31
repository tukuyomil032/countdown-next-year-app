import { HERO_POSTER_URL, HERO_VIDEO_SOURCES_DEFAULT, HERO_VIDEO_SOURCES_NEWYEAR } from '../constants/media'

type BackgroundVideoProps = {
  hedgehogVisualActive: boolean
}

export const BackgroundVideo = ({ hedgehogVisualActive }: BackgroundVideoProps) => {
  return (
    <div className="bg-video" aria-hidden>
      <video className={`bg-video-media ${hedgehogVisualActive ? 'is-hidden' : 'is-active'}`} autoPlay loop muted playsInline poster={HERO_POSTER_URL}>
        {HERO_VIDEO_SOURCES_DEFAULT.map((item) => (
          <source key={item.src} src={item.src} type={item.type} />
        ))}
      </video>
      <video
        key={hedgehogVisualActive ? 'hedgehog-live' : 'hedgehog-idle'}
        className={`bg-video-media ${hedgehogVisualActive ? 'is-active' : 'is-hidden'}`}
        autoPlay
        loop
        muted
        playsInline
        poster={HERO_POSTER_URL}
      >
        {HERO_VIDEO_SOURCES_NEWYEAR.map((item) => (
          <source key={item.src} src={item.src} type={item.type} />
        ))}
      </video>
    </div>
  )
}
