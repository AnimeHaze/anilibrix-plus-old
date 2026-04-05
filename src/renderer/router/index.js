import Vue from 'vue'
import Router from 'vue-router'

import ads from './ads'
import blank from './blank'
import video from './video'
import release from './release'
import catalog from './catalog'
import account from './account'
import releases from './releases'
import favorites from './favorites'

Vue.use(Router)

// WTF? xD
// Suppress router push errors
// Overwrite native push function
const push = Router.prototype.push
Router.prototype.push = function (location) {
  push.call(this, location).catch(() => null)
}

const router = new Router({
  routes: [].concat(
    ads,
    blank,
    video,
    release,
    catalog,
    account,
    releases,
    favorites
  )
})

router.beforeEach((to, from, next) => {
  if (to.name === 'release') {
    localStorage.setItem('last_page_release', JSON.stringify(to.params))
    console.log('Set last page release', to.params)
    next()
  } else {
    if (from.name && to.name !== 'video' && to.name !== 'ads') {
      localStorage.removeItem('last_page_release')
      console.log('Removed last page release', from)
    }
    next()
  }
})

export default router
