'use strict';

/**
 * interface for class have interval task
 * @interface IInterval
 * @property {boolean} done - interval have done
 * @property {number} delay - interval delay
 * @property {function} intervalFunc - interval delay
 */

/**
 * interface for user data
 * @interface IUserData
 * @property {string} localZone -
 * @property {Map<string, Array<string>>} zoneData -
 */

/**
 * interface for data box
 * @interface IDataBox
 * @property {string} [data]
 */

/**
 * interface for segment data
 * @interface ISegment
 * @property {string} segment
 * @property {object} data - <zone, Array<IDataBox>>
 * @property {number} version
 */

/**
 * interface for register
 * @interface IRegister
 * @property {boolean} registered -
 * @property {string} dataId -
 * @property {string} group -
 * @property {string} registId -
 * @property {boolean} enabled -
 * @property {number} timestamp -
 * @property {boolean} isDone -
 */

/**
 * @function
 * @name IRegister#reset
 */

/**
 * @function
 * @name IRegister#unregister
 */

/**
 * interface for registration
 * @interface IRegistration
 * @property {string} dataId
 * @property {string} group
 * @property {string} appname
 */

/**
 * interface for subscriber registration
 * @interface ISubRegistration
 * @extends {IRegistration}
 * @property {string} scope
 * @property {function} listener
 */

/**
 * interface for configurator registration
 * @interface IConfRegistration
 * @extends {IRegistration}
 * @property {function} listener
 */

/**
 * interface for publisher registration
 * @interface IPubRegistration
 * @extends {IRegistration}
 */

/**
 * interface for remote request handler
 * @interface IRequestHandler
 */

/**
 * @function
 * @name IRequestHandler#handleReq
 */

/**
 * interface for configurator data
 * @interface IConfiguratorData
 * @property {IDataBox} dataBox
 * @property {number} version
 */
