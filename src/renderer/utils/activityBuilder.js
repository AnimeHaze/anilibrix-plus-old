class ActivityBuilder {
  constructor () {
    this.buttons = []
    this.largeImageKey = 'libriatyan03'
  }

  setActivityType (type) {
    this.type = type
  }

  setImage (img) {
    this.largeImageKey = img
  }

  firstLine (text) {
    this.details = text
  }

  setLargeImageText (text) {
    this.largeImageText = text
  }

  secondLine (text) {
    this.state = text
  }

  start (date) {
    this.startTimestamp = date
  }

  end (date) {
    this.endTimestamp = date
  }

  firstButton (label, url) {
    this.buttons[0] = {
      label,
      url
    }
  }

  secondButton (label, url) {
    this.buttons[1] = {
      label,
      url
    }
  }
}

export { ActivityBuilder }
