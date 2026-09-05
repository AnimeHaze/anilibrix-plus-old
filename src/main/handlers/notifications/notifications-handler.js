import { Main } from '@main/utils/windows'

export const APP_ERROR = 'app:error'

/**
 * Send app error
 *
 * @param error
 * @return {MainWindow}
 */
export const showAppError = (error) => Main.sendToWindow(APP_ERROR, error)
