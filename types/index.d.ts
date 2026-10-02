declare module 'claude-code' {
  interface PluginState {
    'skill-board': {
      history: {
        total: number
        skills: Array<{
          name: string
          count: number
        }>
      }
    }
  }
}
