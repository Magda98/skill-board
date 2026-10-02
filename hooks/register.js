import { atom, read, update } from 'claude-code'

const PANE_ID = 'skill-board'
const EMPTY_HISTORY = { total: 0, skills: [] }
const history = atom({ plugin: 'skill-board', key: 'history' }, EMPTY_HISTORY)

function recordSkill(current, skillName) {
  const previous = current.skills.find((item) => item.name === skillName)
  const skills = current.skills.filter((item) => item.name !== skillName)

  return {
    total: current.total + 1,
    skills: [
      { name: skillName, count: (previous?.count ?? 0) + 1 },
      ...skills,
    ],
  }
}

function plural(count, singular, pluralForm = `${singular}s`) {
  return count === 1 ? singular : pluralForm
}

export function register(on) {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'skill-board',
      description: 'Open the Skill Board session dashboard',
    })

    return next(e)
  })

  // This event fires when Claude Code expands a skill for the model, including
  // slash-command invocations, Skill tool calls, and preloaded skills.
  on('skill.prompt', async ($, e, next) => {
    const result = await next(e)

    if (typeof e.skill === 'string' && e.skill.trim()) {
      await update($, history, (current) => recordSkill(current, e.skill.trim()))
    }

    return result
  })

  on('command.run', { command: 'skill-board' }, async ($) => {
    await $.ui.open({
      id: PANE_ID,
      title: 'Skill Board',
      focus: true,
      closeOnEscape: true,
      columns: 44,
      rows: 16,
    })

    return {}
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($) => {
    const { Box, Text } = $.ui.resolve(e)
    const current = await read($, history)
    const names = current.skills.slice(0, 3).map((item) => item.name)
    const extraCount = current.skills.length - names.length

    if (current.skills.length === 0) {
      return Box({
        flexDirection: 'row',
        columnGap: 1,
        children: [
          Text({ children: ['✦ SKILLS'], color: 'magenta', bold: true }),
          Text({ children: ['No skills loaded yet'], dimColor: true }),
          Text({ children: ['· /skill-board'], color: 'cyan' }),
        ],
      })
    }

    const summary = `${current.skills.length} ${plural(current.skills.length, 'skill')}`
    const compactNames = names.join(' · ') + (extraCount > 0 ? ` · +${extraCount}` : '')

    return Box({
      flexDirection: 'row',
      columnGap: 1,
      children: [
        Text({ children: ['✦ SKILLS'], color: 'magenta', bold: true }),
        Text({ children: [summary], color: 'yellow' }),
        Text({ children: [compactNames], color: 'cyan', wrap: 'truncate-end' }),
        Text({ children: [`· ${current.total} ${plural(current.total, 'load', 'loads')}`], dimColor: true }),
        Text({ children: ['/skill-board'], color: 'green' }),
      ],
    })
  })

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId !== PANE_ID) return next(e)

    const { Box, Text, Button } = $.ui.resolve(e)
    const current = await read($, history)
    const skillCount = current.skills.length

    const heading = Box({
      flexDirection: 'row',
      columnGap: 1,
      children: [
        Text({ children: ['✦'], color: 'magenta', bold: true }),
        Text({ children: ['SKILL BOARD'], bold: true, color: 'cyan' }),
        Text({ children: ['SESSION VIEW'], dimColor: true }),
      ],
    })

    const summary = Box({
      flexDirection: 'row',
      columnGap: 1,
      children: [
        Text({ children: [String(skillCount)], color: 'yellow', bold: true }),
        Text({ children: [plural(skillCount, 'skill')], color: 'yellow' }),
        Text({ children: ['·'], dimColor: true }),
        Text({ children: [String(current.total)], color: 'green', bold: true }),
        Text({ children: [plural(current.total, 'activation')], color: 'green' }),
      ],
    })

    const content = skillCount === 0
      ? [
          Text({ children: [''], dimColor: true }),
          Text({ children: ['Your skill shelf is clear.'], bold: true }),
          Text({ children: ['As Claude loads skills, they will appear here.'], dimColor: true }),
          Text({ children: [''], dimColor: true }),
          Text({ children: ['Run a skill or ask Claude to use one.'], color: 'cyan' }),
        ]
      : [
          Text({ children: ['RECENTLY LOADED'], color: 'magenta', bold: true }),
          ...current.skills.map((item, index) =>
            Box({
              key: `skill-${item.name}`,
              flexDirection: 'row',
              columnGap: 1,
              children: [
                Text({ children: [index === 0 ? '◆' : '◇'], color: index === 0 ? 'green' : 'blue' }),
                Text({
                  children: [item.name],
                  bold: index === 0,
                  ...(index === 0 ? { color: 'cyan' } : {}),
                  wrap: 'truncate-end',
                }),
                Text({ children: [`×${item.count}`], color: 'yellow' }),
                ...(index === 0 ? [Text({ children: ['LATEST'], color: 'green', dimColor: true })] : []),
              ],
            }),
          ),
        ]

    const footer = Box({
      flexDirection: 'row',
      columnGap: 2,
      children: [
        Button({
          key: 'clear-history',
          label: 'Clear history',
          hotkey: 'c',
          plain: true,
          onPress: () => update($, history, () => EMPTY_HISTORY),
        }),
        Text({ children: ['Esc closes'], dimColor: true }),
      ],
    })

    return Box({
      flexDirection: 'column',
      rowGap: 1,
      children: [
        heading,
        Text({ children: ['────────────────────────────────────────'], color: 'blue' }),
        summary,
        Text({ children: ['Expanded skill prompts this session'], dimColor: true }),
        ...content,
        Text({ children: ['────────────────────────────────────────'], color: 'blue' }),
        footer,
      ],
    })
  })
}
