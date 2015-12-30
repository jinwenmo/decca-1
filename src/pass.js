import h from 'virtual-dom/h'
import fixProps from './fix_props'
import Widget from './widget'

module.exports = buildPass

/*
 * A rendering pass.
 * This closure is responsible for:
 *
 * - keeping aware of `context` and `state` to be passed down to Components
 *
 *     pass = buildPass(...)
 *     pass.build(el)               // render a component/node
 *     pass.commitState({...})      // make changes to the state, silently
 *     pass.setState({...})         // make changes to the state, rerender after
 *     pass.states                  // the component states mega-object
 */

function buildPass (context, dispatch, states, commitState, rerender) {
  let working = true
  const pass = { build, setState, commitState, states }

  /*
   * Builds from a vnode (`element()` output) to a virtual hyperscript element.
   * The `context` and `dispatch` is passed down recursively.
   * https://github.com/Matt-Esch/virtual-dom/blob/master/virtual-hyperscript/README.md
   */

  function build (el) {
    if (typeof el === 'string') return el
    if (typeof el === 'number') return '' + el
    if (typeof el === 'undefined' || el === null) return
    if (Array.isArray(el)) return el.map(build)

    const { tag, props, children } = el

    // Defer to Widget if it's a component
    if (typeof tag === 'object') {
      if (!tag.render) throw new Error('no render() in component')
      return new Widget(
        { component: tag, props, children },
        { context, dispatch },
        pass)
    }

    return h(tag, fixProps(props), children.map(build))
  }

  /*
   * Called by Components (via Widget). Queues up state changes, and updates it
   * when it can.
   */

  function setState (componentId, state = {}) {
    commitState(componentId, state)
    rerender()
  }

  return pass
}
