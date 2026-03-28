import { registerRenderer } from '../registry'
import NumberTrain from './NumberTrain'

registerRenderer({
  id: 'sequence',
  name: { zh: '数字火车', en: 'Number Train' },
  component: NumberTrain,
  author: 'EurekaCub Core',
  version: '1.0.0',
})
