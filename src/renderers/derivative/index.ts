import { registerRenderer } from '../registry'
import SpeedController from './SpeedController'

registerRenderer({
  id: 'derivative',
  name: { zh: '速度控制器', en: 'Speed Controller' },
  component: SpeedController,
  author: 'EurekaCub Core',
  version: '1.0.0',
})
