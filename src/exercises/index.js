import { exercise23  } from './exercise23.js'
import { exercise26a } from './exercise26a.js'
import { exercise26b } from './exercise26b.js'
import { exercise26c } from './exercise26c.js'

/**
 * Exercise registry.
 * Key = URL-safe ID used in the hash: e.g. http://localhost:5173/#26a
 * Value = exercise definition object.
 */
export const exercises = {
  '23':  exercise23,
  '26a': exercise26a,
  '26b': exercise26b,
  '26c': exercise26c,
}
