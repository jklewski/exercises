import { exercise1   } from './exercise1.js'
import { exercise2   } from './exercise2.js'
import { exercise3   } from './exercise3.js'
import { exercise16  } from './exercise16.js'
import { exercise20  } from './exercise20.js'
//import { exercise3   } from './exercise3.js'
import { exercise14  } from './exercise14.js'
import { exercise19  } from './exercise19.js'
import { exercise21  } from './exercise21.js'
import { exercise22  } from './exercise22.js'
import { exercise23  } from './exercise23.js'
import { exercise24  } from './exercise24.js'
import { exercise26a } from './exercise26a.js'
import { exercise26b } from './exercise26b.js'
import { exercise26c } from './exercise26c.js'
import { exercise29  } from './exercise29.js'

/**
 * Exercise registry.
 * Key = URL-safe ID used in the hash: e.g. http://localhost:5173/#26a
 * Value = exercise definition object.
 */
export const exercises = {
  '1': exercise1,
  '2': exercise2,
  '3': exercise3,
  '16': exercise16,
  '20': exercise20,
  //'3':  exercise3,
  '14': exercise14,
  '19': exercise19,
  '21': exercise21,
  '22': exercise22,
  '23': exercise23,
  '24': exercise24,
  '26a': exercise26a,
  '26b': exercise26b,
  '26c': exercise26c,
  '29': exercise29,
}
