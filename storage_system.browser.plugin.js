/**
 * 浏览器预览版：与 `storage_system (1).js` 中 Rhea Plugin 同构的入口，
 * 按 SVG 内 inkscape:label="#BUTTON:xxx" 解析点击，并走同一套 onClick 分支逻辑。
 * 不依赖 window.rhea；在 Rhea 内请继续使用原始脚本。
 */
;(function (global) {
  'use strict'

  var INK_NS = 'http://www.inkscape.org/namespaces/inkscape'
  var BUTTON_PREFIX = '#BUTTON:'

  function getInkscapeLabel(el) {
    if (!el || el.nodeType !== 1) return ''
    return (
      el.getAttribute('inkscape:label') ||
      el.getAttributeNS(INK_NS, 'label') ||
      ''
    )
  }

  /**
   * 给所有带 #BUTTON: 的节点加 class，便于 cursor 样式。
   */
  function markInkscapeButtons(svg) {
    var nodes = svg.getElementsByTagName('*')
    var i
    for (i = 0; i < nodes.length; i++) {
      var el = nodes[i]
      var lab = getInkscapeLabel(el)
      if (lab.indexOf(BUTTON_PREFIX) === 0) {
        el.classList.add('svg-inkscape-button')
      }
    }
  }

  /**
   * 事件委托：从点击目标向上找到最近的 #BUTTON: 标签并调用 plugin.onClick(action)。
   */
  function bindSvg(svg, plugin) {
    markInkscapeButtons(svg)
    svg.addEventListener('click', function (e) {
      var t = e.target
      if (t === svg) return
      while (t && t !== svg) {
        var lab = getInkscapeLabel(t)
        if (lab.indexOf(BUTTON_PREFIX) === 0) {
          e.preventDefault()
          e.stopPropagation()
          var action = lab.slice(BUTTON_PREFIX.length)
          plugin.onClick(action)
          return
        }
        t = t.parentNode
      }
    })
  }

  /**
   * @param {object} options
   * @param {string} [options.svgId]
   * @param {number} [options.scale]
   * @param {number} [options.width]
   * @param {number} [options.height]
   * @param {object} [options.hooks]
   * @param {function(string): void} [options.hooks.toast]
   * @param {function(): Promise<void>|void} [options.hooks.onIntoGeneral]
   * @param {function(): Promise<void>|void} [options.hooks.onOutGeneral]
   * @param {function(object): Promise<void>|void} [options.hooks.onSyncData]
   */
  function Plugin(options) {
    options = options || {}
    this._svgId = options.svgId || ''
    this.scale = options.scale !== undefined ? options.scale : 2.8
    this.width = options.width !== undefined ? options.width : 1709
    this.height = options.height !== undefined ? options.height : 2200
    this._hooks = options.hooks || {}
  }

  Object.defineProperty(Plugin.prototype, 'svgId', {
    get: function () {
      return this._svgId
    },
    set: function (v) {
      this._svgId = v
    }
  })

  Plugin.prototype._toast = function (msg) {
    if (this._hooks.toast) this._hooks.toast(msg)
    else console.log('[Plugin demo]', msg)
  }

  /**
   * 与 Rhea 版 onClick 分支对齐（无后端调用）。
   */
  Plugin.prototype.onClick = async function (name) {
    try {
      name = String(name || '').toLowerCase()
      console.log('[Plugin::' + this.svgId + '] onClick', name)

      var optName = name.split('@')[0] || name
      console.log('>>> optName:', optName)

      switch (optName) {
        case 'view':
          this._toast('Demo: view (production opens NocoBase resource page)')
          break
        case 'batch_load':
          this._toast('Demo: batch_load (production opens batch scan)')
          break
        case 'batch_unload':
          this._toast('Demo: batch_unload')
          break
        case 'tidy_up':
          this._toast('Demo: tidy_up')
          break
        case 'monitor':
          console.log('>>> monitor')
          break
        case 'refresh':
          this._toast('Demo: refresh (production: clearChecked + refreshSvg)')
          break
        case 'into_general':
          if (this._hooks.onIntoGeneral) await this._hooks.onIntoGeneral()
          else this._toast('Demo: into_general (onIntoGeneral hook not registered)')
          break
        case 'out_general':
          if (this._hooks.onOutGeneral) await this._hooks.onOutGeneral()
          else this._toast('Demo: out_general (onOutGeneral hook not registered)')
          break
        case 'out_open_loaded':
          this._toast('Demo: out_open_loaded')
          break
        case 'into_open_loaded':
          this._toast('Demo: into_open_loaded')
          break
        case 'rack_transfer':
          this._toast('Demo: rack_transfer')
          break
        case 'path':
          /* #BUTTON:PATH 装饰性路径，与 Rhea 一致不做业务 */
          break
        case 'light':
          this._toast('Demo：light')
          break
        case 'res_init':
          this._toast('Demo：res_init')
          break
        default:
          if (name && name.indexOf('@') === -1) {
            var lastSlashIndex = name.lastIndexOf('/')
            var location = name.substring(0, lastSlashIndex)
            var slotName = name.substring(lastSlashIndex + 1)
            console.log('>>> name:', name, 'location:', location, 'slotName:', slotName)
            if (!location || !slotName) {
              this._toast('Invalid location/slot: ' + name)
            }
          } else if (name.indexOf('@') !== -1) {
            this._toast('Demo: slot/device action "' + name + '" (resolved by Rhea in production)')
          }
          break
      }
    } catch (err) {
      console.error(err)
      this._toast(String(err && err.message ? err.message : err))
    } finally {
      /* Rhea 版调用 loadingHide；浏览器 demo 省略 */
    }
  }

  Plugin.prototype.onSyncData = async function (data) {
    console.log('[Plugin::' + this.svgId + '] onSyncData', data)
    if (this._hooks.onSyncData) await this._hooks.onSyncData(data)
  }

  global.StorageSystemSvg = {
    Plugin: Plugin,
    bind: bindSvg,
    getInkscapeLabel: getInkscapeLabel,
    BUTTON_PREFIX: BUTTON_PREFIX
  }
})(typeof window !== 'undefined' ? window : this)
