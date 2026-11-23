// Reads the device class set by the inline script in views/index.pug.
const root = document.documentElement

const Detection = {
  isPhone: () => root.classList.contains('phone'),
  isTablet: () => root.classList.contains('tablet'),
  isDesktop: () => root.classList.contains('desktop'),
  isTouch: () => !root.classList.contains('desktop')
}

export default Detection
