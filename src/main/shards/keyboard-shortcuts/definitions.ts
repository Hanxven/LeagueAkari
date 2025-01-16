export interface KeyDefinition {
  _nameRaw: string
  name: string
  standardName: string
  keyId: string
}

// 键位信息来自 global-key-listener
export const VKEY_MAP: Record<string, KeyDefinition> = {
  1: {
    _nameRaw: 'VK_LBUTTON',
    name: 'LBUTTON',
    standardName: 'MOUSE LEFT',
    keyId: 'LeftMouseButton'
  },
  2: {
    _nameRaw: 'VK_RBUTTON',
    name: 'RBUTTON',
    standardName: 'MOUSE RIGHT',
    keyId: 'RightMouseButton'
  },
  3: {
    _nameRaw: 'VK_CANCEL',
    name: 'CANCEL',
    standardName: '',
    keyId: 'Cancel'
  },
  4: {
    _nameRaw: 'VK_MBUTTON',
    name: 'MBUTTON',
    standardName: 'MOUSE MkeyIdDLE',
    keyId: 'MkeyIddleMouseButton'
  },
  5: {
    _nameRaw: 'VK_XBUTTON1',
    name: 'XBUTTON1',
    standardName: 'MOUSE X1',
    keyId: 'MouseXButton1'
  },
  6: {
    _nameRaw: 'VK_XBUTTON2',
    name: 'XBUTTON2',
    standardName: 'MOUSE X2',
    keyId: 'MouseXButton2'
  },
  8: {
    _nameRaw: 'VK_BACK',
    name: 'BACK',
    standardName: 'BACKSPACE',
    keyId: 'Backspace'
  },
  9: {
    _nameRaw: 'VK_TAB',
    name: 'TAB',
    standardName: 'TAB',
    keyId: 'Tab'
  },
  12: {
    _nameRaw: 'VK_CLEAR',
    name: 'CLEAR',
    standardName: 'NUMPAD CLEAR',
    keyId: 'NumpadClear'
  },
  13: {
    _nameRaw: 'VK_RETURN',
    name: 'RETURN',
    standardName: 'RETURN',
    keyId: 'Enter'
  },
  16: {
    _nameRaw: 'VK_SHIFT',
    name: 'SHIFT',
    standardName: '',
    keyId: 'Shift'
  },
  17: {
    _nameRaw: 'VK_CONTROL',
    name: 'CONTROL',
    standardName: '',
    keyId: 'Control'
  },
  18: {
    _nameRaw: 'VK_MENU',
    name: 'MENU',
    standardName: '',
    keyId: 'Alt'
  },
  19: {
    _nameRaw: 'VK_PAUSE',
    name: 'PAUSE',
    standardName: '',
    keyId: 'Pause'
  },
  20: {
    _nameRaw: 'VK_CAPITAL',
    name: 'CAPSLOCK',
    standardName: 'CAPS LOCK',
    keyId: 'CapsLock'
  },
  21: {
    _nameRaw: 'VK_KANA',
    name: 'KANA',
    standardName: '',
    keyId: 'Kana'
  },
  22: {
    _nameRaw: 'VK_IME_ON',
    name: 'IME_ON',
    standardName: '',
    keyId: 'IMEOn'
  },
  23: {
    _nameRaw: 'VK_JUNJA',
    name: 'JUNJA',
    standardName: '',
    keyId: 'Junja'
  },
  24: {
    _nameRaw: 'VK_FINAL',
    name: 'FINAL',
    standardName: '',
    keyId: 'Final'
  },
  25: {
    _nameRaw: 'VK_HANJA',
    name: 'HANJA',
    standardName: '',
    keyId: 'Hanja'
  },
  26: {
    _nameRaw: 'VK_IME_OFF',
    name: 'IME_OFF',
    standardName: '',
    keyId: 'IMEOff'
  },
  27: {
    _nameRaw: 'VK_ESCAPE',
    name: 'ESCAPE',
    standardName: 'ESCAPE',
    keyId: 'Escape'
  },
  28: {
    _nameRaw: 'VK_CONVERT',
    name: 'CONVERT',
    standardName: '',
    keyId: 'Convert'
  },
  29: {
    _nameRaw: 'VK_NONCONVERT',
    name: 'NONCONVERT',
    standardName: '',
    keyId: 'NonConvert'
  },
  30: {
    _nameRaw: 'VK_ACCEPT',
    name: 'ACCEPT',
    standardName: '',
    keyId: 'Accept'
  },
  31: {
    _nameRaw: 'VK_MODECHANGE',
    name: 'MODECHANGE',
    standardName: '',
    keyId: 'ModeChange'
  },
  32: {
    _nameRaw: 'VK_SPACE',
    name: 'SPACE',
    standardName: 'SPACE',
    keyId: 'Space'
  },
  33: {
    _nameRaw: 'VK_PRIOR',
    name: 'PRIOR',
    standardName: 'PAGE UP',
    keyId: 'PageUp'
  },
  34: {
    _nameRaw: 'VK_NEXT',
    name: 'NEXT',
    standardName: 'PAGE DOWN',
    keyId: 'PageDown'
  },
  35: {
    _nameRaw: 'VK_END',
    name: 'END',
    standardName: 'END',
    keyId: 'End'
  },
  36: {
    _nameRaw: 'VK_HOME',
    name: 'HOME',
    standardName: 'HOME',
    keyId: 'Home'
  },
  37: {
    _nameRaw: 'VK_LEFT',
    name: 'LEFT',
    standardName: 'LEFT ARROW',
    keyId: 'LeftArrow'
  },
  38: {
    _nameRaw: 'VK_UP',
    name: 'UP',
    standardName: 'UP ARROW',
    keyId: 'UpArrow'
  },
  39: {
    _nameRaw: 'VK_RIGHT',
    name: 'RIGHT',
    standardName: 'RIGHT ARROW',
    keyId: 'RightArrow'
  },
  40: {
    _nameRaw: 'VK_DOWN',
    name: 'DOWN',
    standardName: 'DOWN ARROW',
    keyId: 'DownArrow'
  },
  41: {
    _nameRaw: 'VK_SELECT',
    name: 'SELECT',
    standardName: '',
    keyId: 'Select'
  },
  42: {
    _nameRaw: 'VK_PRINT',
    name: 'PRINT',
    standardName: '',
    keyId: 'Print'
  },
  43: {
    _nameRaw: 'VK_EXECUTE',
    name: 'EXECUTE',
    standardName: '',
    keyId: 'Execute'
  },
  44: {
    _nameRaw: 'VK_SNAPSHOT',
    name: 'SNAPSHOT',
    standardName: 'PRINT SCREEN',
    keyId: 'PrintScreen'
  },
  45: {
    _nameRaw: 'VK_INSERT',
    name: 'INSERT',
    standardName: 'INS',
    keyId: 'Insert'
  },
  46: {
    _nameRaw: 'VK_DELETE',
    name: 'DELETE',
    standardName: 'DELETE',
    keyId: 'Delete'
  },
  47: {
    _nameRaw: 'VK_HELP',
    name: 'HELP',
    standardName: '',
    keyId: 'Help'
  },
  48: { _nameRaw: 'VK_0', name: '0', standardName: '0', keyId: '0' },
  49: { _nameRaw: 'VK_1', name: '1', standardName: '1', keyId: '1' },
  50: { _nameRaw: 'VK_2', name: '2', standardName: '2', keyId: '2' },
  51: { _nameRaw: 'VK_3', name: '3', standardName: '3', keyId: '3' },
  52: { _nameRaw: 'VK_4', name: '4', standardName: '4', keyId: '4' },
  53: { _nameRaw: 'VK_5', name: '5', standardName: '5', keyId: '5' },
  54: { _nameRaw: 'VK_6', name: '6', standardName: '6', keyId: '6' },
  55: { _nameRaw: 'VK_7', name: '7', standardName: '7', keyId: '7' },
  56: { _nameRaw: 'VK_8', name: '8', standardName: '8', keyId: '8' },
  57: { _nameRaw: 'VK_9', name: '9', standardName: '9', keyId: '9' },
  65: { _nameRaw: 'VK_A', name: 'A', standardName: 'A', keyId: 'A' },
  66: { _nameRaw: 'VK_B', name: 'B', standardName: 'B', keyId: 'B' },
  67: { _nameRaw: 'VK_C', name: 'C', standardName: 'C', keyId: 'C' },
  68: { _nameRaw: 'VK_D', name: 'D', standardName: 'D', keyId: 'D' },
  69: { _nameRaw: 'VK_E', name: 'E', standardName: 'E', keyId: 'E' },
  70: { _nameRaw: 'VK_F', name: 'F', standardName: 'F', keyId: 'F' },
  71: { _nameRaw: 'VK_G', name: 'G', standardName: 'G', keyId: 'G' },
  72: { _nameRaw: 'VK_H', name: 'H', standardName: 'H', keyId: 'H' },
  73: { _nameRaw: 'VK_I', name: 'I', standardName: 'I', keyId: 'I' },
  74: { _nameRaw: 'VK_J', name: 'J', standardName: 'J', keyId: 'J' },
  75: { _nameRaw: 'VK_K', name: 'K', standardName: 'K', keyId: 'K' },
  76: { _nameRaw: 'VK_L', name: 'L', standardName: 'L', keyId: 'L' },
  77: { _nameRaw: 'VK_M', name: 'M', standardName: 'M', keyId: 'M' },
  78: { _nameRaw: 'VK_N', name: 'N', standardName: 'N', keyId: 'N' },
  79: { _nameRaw: 'VK_O', name: 'O', standardName: 'O', keyId: 'O' },
  80: { _nameRaw: 'VK_P', name: 'P', standardName: 'P', keyId: 'P' },
  81: { _nameRaw: 'VK_Q', name: 'Q', standardName: 'Q', keyId: 'Q' },
  82: { _nameRaw: 'VK_R', name: 'R', standardName: 'R', keyId: 'R' },
  83: { _nameRaw: 'VK_S', name: 'S', standardName: 'S', keyId: 'S' },
  84: { _nameRaw: 'VK_T', name: 'T', standardName: 'T', keyId: 'T' },
  85: { _nameRaw: 'VK_U', name: 'U', standardName: 'U', keyId: 'U' },
  86: { _nameRaw: 'VK_V', name: 'V', standardName: 'V', keyId: 'V' },
  87: { _nameRaw: 'VK_W', name: 'W', standardName: 'W', keyId: 'W' },
  88: { _nameRaw: 'VK_X', name: 'X', standardName: 'X', keyId: 'X' },
  89: { _nameRaw: 'VK_Y', name: 'Y', standardName: 'Y', keyId: 'Y' },
  90: { _nameRaw: 'VK_Z', name: 'Z', standardName: 'Z', keyId: 'Z' },
  91: {
    _nameRaw: 'VK_LWIN',
    name: 'LWIN',
    standardName: 'LEFT META',
    keyId: 'LeftMeta'
  },
  92: {
    _nameRaw: 'VK_RWIN',
    name: 'RWIN',
    standardName: 'RIGHT META',
    keyId: 'RightMeta'
  },
  93: {
    _nameRaw: 'VK_APPS',
    name: 'APPS',
    standardName: '',
    keyId: 'Apps'
  },
  95: {
    _nameRaw: 'VK_SLEEP',
    name: 'SLEEP',
    standardName: '',
    keyId: 'Sleep'
  },
  96: {
    _nameRaw: 'VK_NUMPAD0',
    name: 'NUMPAD0',
    standardName: 'NUMPAD 0',
    keyId: 'Numpad0'
  },
  97: {
    _nameRaw: 'VK_NUMPAD1',
    name: 'NUMPAD1',
    standardName: 'NUMPAD 1',
    keyId: 'Numpad1'
  },
  98: {
    _nameRaw: 'VK_NUMPAD2',
    name: 'NUMPAD2',
    standardName: 'NUMPAD 2',
    keyId: 'Numpad2'
  },
  99: {
    _nameRaw: 'VK_NUMPAD3',
    name: 'NUMPAD3',
    standardName: 'NUMPAD 3',
    keyId: 'Numpad3'
  },
  100: {
    _nameRaw: 'VK_NUMPAD4',
    name: 'NUMPAD4',
    standardName: 'NUMPAD 4',
    keyId: 'Numpad4'
  },
  101: {
    _nameRaw: 'VK_NUMPAD5',
    name: 'NUMPAD5',
    standardName: 'NUMPAD 5',
    keyId: 'Numpad5'
  },
  102: {
    _nameRaw: 'VK_NUMPAD6',
    name: 'NUMPAD6',
    standardName: 'NUMPAD 6',
    keyId: 'Numpad6'
  },
  103: {
    _nameRaw: 'VK_NUMPAD7',
    name: 'NUMPAD7',
    standardName: 'NUMPAD 7',
    keyId: 'Numpad7'
  },
  104: {
    _nameRaw: 'VK_NUMPAD8',
    name: 'NUMPAD8',
    standardName: 'NUMPAD 8',
    keyId: 'Numpad8'
  },
  105: {
    _nameRaw: 'VK_NUMPAD9',
    name: 'NUMPAD9',
    standardName: 'NUMPAD 9',
    keyId: 'Numpad9'
  },
  106: {
    _nameRaw: 'VK_MULTIPLY',
    name: 'MULTIPLY',
    standardName: 'NUMPAD MULTIPLY',
    keyId: 'NumpadMultiply'
  },
  107: {
    _nameRaw: 'VK_ADD',
    name: 'ADD',
    standardName: 'NUMPAD PLUS',
    keyId: 'NumpadPlus'
  },
  108: {
    _nameRaw: 'VK_SEPARATOR',
    name: 'SEPARATOR',
    standardName: '',
    keyId: 'Separator'
  },
  109: {
    _nameRaw: 'VK_SUBTRACT',
    name: 'SUBTRACT',
    standardName: 'NUMPAD MINUS',
    keyId: 'NumpadMinus'
  },
  110: {
    _nameRaw: 'VK_DECIMAL',
    name: 'DECIMAL',
    standardName: 'NUMPAD DOT',
    keyId: 'NumpadDot'
  },
  111: {
    _nameRaw: 'VK_DIVkeyIdE',
    name: 'DIVkeyIdE',
    standardName: 'NUMPAD DIVkeyIdE',
    keyId: 'NumpadDivkeyIde'
  },
  112: {
    _nameRaw: 'VK_F1',
    name: 'F1',
    standardName: 'F1',
    keyId: 'F1'
  },
  113: {
    _nameRaw: 'VK_F2',
    name: 'F2',
    standardName: 'F2',
    keyId: 'F2'
  },
  114: {
    _nameRaw: 'VK_F3',
    name: 'F3',
    standardName: 'F3',
    keyId: 'F3'
  },
  115: {
    _nameRaw: 'VK_F4',
    name: 'F4',
    standardName: 'F4',
    keyId: 'F4'
  },
  116: {
    _nameRaw: 'VK_F5',
    name: 'F5',
    standardName: 'F5',
    keyId: 'F5'
  },
  117: {
    _nameRaw: 'VK_F6',
    name: 'F6',
    standardName: 'F6',
    keyId: 'F6'
  },
  118: {
    _nameRaw: 'VK_F7',
    name: 'F7',
    standardName: 'F7',
    keyId: 'F7'
  },
  119: {
    _nameRaw: 'VK_F8',
    name: 'F8',
    standardName: 'F8',
    keyId: 'F8'
  },
  120: {
    _nameRaw: 'VK_F9',
    name: 'F9',
    standardName: 'F9',
    keyId: 'F9'
  },
  121: {
    _nameRaw: 'VK_F10',
    name: 'F10',
    standardName: 'F10',
    keyId: 'F10'
  },
  122: {
    _nameRaw: 'VK_F11',
    name: 'F11',
    standardName: 'F11',
    keyId: 'F11'
  },
  123: {
    _nameRaw: 'VK_F12',
    name: 'F12',
    standardName: 'F12',
    keyId: 'F12'
  },
  124: {
    _nameRaw: 'VK_F13',
    name: 'F13',
    standardName: 'F13',
    keyId: 'F13'
  },
  125: {
    _nameRaw: 'VK_F14',
    name: 'F14',
    standardName: 'F14',
    keyId: 'F14'
  },
  126: {
    _nameRaw: 'VK_F15',
    name: 'F15',
    standardName: 'F15',
    keyId: 'F15'
  },
  127: {
    _nameRaw: 'VK_F16',
    name: 'F16',
    standardName: 'F16',
    keyId: 'F16'
  },
  128: {
    _nameRaw: 'VK_F17',
    name: 'F17',
    standardName: 'F17',
    keyId: 'F17'
  },
  129: {
    _nameRaw: 'VK_F18',
    name: 'F18',
    standardName: 'F18',
    keyId: 'F18'
  },
  130: {
    _nameRaw: 'VK_F19',
    name: 'F19',
    standardName: 'F19',
    keyId: 'F19'
  },
  131: {
    _nameRaw: 'VK_F20',
    name: 'F20',
    standardName: 'F20',
    keyId: 'F20'
  },
  132: {
    _nameRaw: 'VK_F21',
    name: 'F21',
    standardName: 'F21',
    keyId: 'F21'
  },
  133: {
    _nameRaw: 'VK_F22',
    name: 'F22',
    standardName: 'F22',
    keyId: 'F22'
  },
  134: {
    _nameRaw: 'VK_F23',
    name: 'F23',
    standardName: 'F23',
    keyId: 'F23'
  },
  135: {
    _nameRaw: 'VK_F24',
    name: 'F24',
    standardName: 'F24',
    keyId: 'F24'
  },
  144: {
    _nameRaw: 'VK_NUMLOCK',
    name: 'NUMLOCK',
    standardName: 'NUM LOCK',
    keyId: 'NumLock'
  },
  145: {
    _nameRaw: 'VK_SCROLL',
    name: 'SCROLL',
    standardName: 'SCROLL LOCK',
    keyId: 'ScrollLock'
  },
  160: {
    _nameRaw: 'VK_LSHIFT',
    name: 'LSHIFT',
    standardName: 'LEFT SHIFT',
    keyId: 'LeftShift'
  },
  161: {
    _nameRaw: 'VK_RSHIFT',
    name: 'RSHIFT',
    standardName: 'RIGHT SHIFT',
    keyId: 'RightShift'
  },
  162: {
    _nameRaw: 'VK_LCONTROL',
    name: 'LCONTROL',
    standardName: 'LEFT CTRL',
    keyId: 'LeftControl'
  },
  163: {
    _nameRaw: 'VK_RCONTROL',
    name: 'RCONTROL',
    standardName: 'RIGHT CTRL',
    keyId: 'RightControl'
  },
  164: {
    _nameRaw: 'VK_LMENU',
    name: 'LALT',
    standardName: 'LEFT ALT',
    keyId: 'LeftAlt'
  },
  165: {
    _nameRaw: 'VK_RMENU',
    name: 'RALT',
    standardName: 'RIGHT ALT',
    keyId: 'RightAlt'
  },
  166: {
    _nameRaw: 'VK_BROWSER_BACK',
    name: 'BROWSER_BACK',
    standardName: '',
    keyId: 'BrowserBack'
  },
  167: {
    _nameRaw: 'VK_BROWSER_FORWARD',
    name: 'BROWSER_FORWARD',
    standardName: '',
    keyId: 'BrowserForward'
  },
  168: {
    _nameRaw: 'VK_BROWSER_REFRESH',
    name: 'BROWSER_REFRESH',
    standardName: '',
    keyId: 'BrowserRefresh'
  },
  169: {
    _nameRaw: 'VK_BROWSER_STOP',
    name: 'BROWSER_STOP',
    standardName: '',
    keyId: 'BrowserStop'
  },
  170: {
    _nameRaw: 'VK_BROWSER_SEARCH',
    name: 'BROWSER_SEARCH',
    standardName: '',
    keyId: 'BrowserSearch'
  },
  171: {
    _nameRaw: 'VK_BROWSER_FAVORITES',
    name: 'BROWSER_FAVORITES',
    standardName: '',
    keyId: 'BrowserFavorites'
  },
  172: {
    _nameRaw: 'VK_BROWSER_HOME',
    name: 'BROWSER_HOME',
    standardName: '',
    keyId: 'BrowserHome'
  },
  173: {
    _nameRaw: 'VK_VOLUME_MUTE',
    name: 'VOLUME_MUTE',
    standardName: '',
    keyId: 'VolumeMute'
  },
  174: {
    _nameRaw: 'VK_VOLUME_DOWN',
    name: 'VOLUME_DOWN',
    standardName: '',
    keyId: 'VolumeDown'
  },
  175: {
    _nameRaw: 'VK_VOLUME_UP',
    name: 'VOLUME_UP',
    standardName: '',
    keyId: 'VolumeUp'
  },
  176: {
    _nameRaw: 'VK_MEDIA_NEXT_TRACK',
    name: 'MEDIA_NEXT_TRACK',
    standardName: '',
    keyId: 'NextTrack'
  },
  177: {
    _nameRaw: 'VK_MEDIA_PREV_TRACK',
    name: 'MEDIA_PREV_TRACK',
    standardName: '',
    keyId: 'PreviousTrack'
  },
  178: {
    _nameRaw: 'VK_MEDIA_STOP',
    name: 'MEDIA_STOP',
    standardName: '',
    keyId: 'StopMedia'
  },
  179: {
    _nameRaw: 'VK_MEDIA_PLAY_PAUSE',
    name: 'MEDIA_PLAY_PAUSE',
    standardName: '',
    keyId: 'PlayPauseMedia'
  },
  180: {
    _nameRaw: 'VK_LAUNCH_MAIL',
    name: 'LAUNCH_MAIL',
    standardName: '',
    keyId: 'LaunchMail'
  },
  181: {
    _nameRaw: 'VK_LAUNCH_MEDIA_SELECT',
    name: 'LAUNCH_MEDIA_SELECT',
    standardName: '',
    keyId: 'LaunchMediaSelect'
  },
  182: {
    _nameRaw: 'VK_LAUNCH_APP1',
    name: 'LAUNCH_APP1',
    standardName: '',
    keyId: 'LaunchApp1'
  },
  183: {
    _nameRaw: 'VK_LAUNCH_APP2',
    name: 'LAUNCH_APP2',
    standardName: '',
    keyId: 'LaunchApp2'
  },
  186: {
    _nameRaw: 'VK_OEM_1',
    name: 'OEM_1',
    standardName: 'SEMICOLON',
    keyId: 'Semicolon'
  },
  187: {
    _nameRaw: 'VK_OEM_PLUS',
    name: 'OEM_PLUS',
    standardName: 'EQUALS',
    keyId: 'Equals'
  },
  188: {
    _nameRaw: 'VK_OEM_COMMA',
    name: 'OEM_COMMA',
    standardName: 'COMMA',
    keyId: 'Comma'
  },
  189: {
    _nameRaw: 'VK_OEM_MINUS',
    name: 'OEM_MINUS',
    standardName: 'MINUS',
    keyId: 'Minus'
  },
  190: {
    _nameRaw: 'VK_OEM_PERIOD',
    name: 'OEM_PERIOD',
    standardName: 'DOT',
    keyId: 'Dot'
  },
  191: {
    _nameRaw: 'VK_OEM_2',
    name: 'OEM_2',
    standardName: 'FORWARD SLASH',
    keyId: 'ForwardSlash'
  },
  192: {
    _nameRaw: 'VK_OEM_3',
    name: 'OEM_3',
    standardName: 'SECTION',
    keyId: 'Section'
  },
  219: {
    _nameRaw: 'VK_OEM_4',
    name: 'OEM_4',
    standardName: 'SQUARE BRACKET OPEN',
    keyId: 'OpenBracket'
  },
  220: {
    _nameRaw: 'VK_OEM_5',
    name: 'OEM_5',
    standardName: 'BACKSLASH',
    keyId: 'Backslash'
  },
  221: {
    _nameRaw: 'VK_OEM_6',
    name: 'OEM_6',
    standardName: 'SQUARE BRACKET CLOSE',
    keyId: 'CloseBracket'
  },
  222: {
    _nameRaw: 'VK_OEM_7',
    name: 'OEM_7',
    standardName: 'QUOTE',
    keyId: 'Quote'
  },
  223: {
    _nameRaw: 'VK_OEM_8',
    name: 'OEM_8',
    standardName: '',
    keyId: 'OEM8'
  },
  226: {
    _nameRaw: 'VK_OEM_102',
    name: 'OEM_102',
    standardName: 'BACKTICK',
    keyId: 'Backtick'
  },
  229: {
    _nameRaw: 'VK_PROCESSKEY',
    name: 'PROCESSKEY',
    standardName: '',
    keyId: 'ProcessKey'
  },
  231: {
    _nameRaw: 'VK_PACKET',
    name: 'PACKET',
    standardName: '',
    keyId: 'Packet'
  },
  246: {
    _nameRaw: 'VK_ATTN',
    name: 'ATTN',
    standardName: '',
    keyId: 'Attention'
  },
  247: {
    _nameRaw: 'VK_CRSEL',
    name: 'CRSEL',
    standardName: '',
    keyId: 'CrSel'
  },
  248: {
    _nameRaw: 'VK_EXSEL',
    name: 'EXSEL',
    standardName: '',
    keyId: 'ExSel'
  },
  249: {
    _nameRaw: 'VK_EREOF',
    name: 'EREOF',
    standardName: '',
    keyId: 'EraseEOF'
  },
  250: {
    _nameRaw: 'VK_PLAY',
    name: 'PLAY',
    standardName: '',
    keyId: 'Play'
  },
  251: {
    _nameRaw: 'VK_ZOOM',
    name: 'ZOOM',
    standardName: '',
    keyId: 'Zoom'
  },
  252: {
    _nameRaw: 'VK_NONAME',
    name: 'NONAME',
    standardName: '',
    keyId: 'NoName'
  },
  253: {
    _nameRaw: 'VK_PA1',
    name: 'PA1',
    standardName: '',
    keyId: 'PA1'
  },
  254: {
    _nameRaw: 'VK_OEM_CLEAR',
    name: 'OEM_CLEAR',
    standardName: '',
    keyId: 'OEMClear'
  }
}

export const MODIFIER_KEYS = new Set([17, 16, 18, 160, 162, 164, 91, 161, 163, 165, 92])

export const UNIFIED_KEY_ID = {
  16: 'Shift',
  160: 'Shift',
  161: 'Shift',
  162: 'Control',
  163: 'Control',
  164: 'Alt',
  165: 'Alt',
  91: 'Meta',
  92: 'Meta',
  96: '0',
  97: '1',
  98: '2',
  99: '3',
  100: '4',
  101: '5',
  102: '6',
  103: '7',
  104: '8',
  105: '9',
  109: 'Minus',
  110: 'Dot'
} as const

const COMMON_MODIFIER_KEY = [
  // Alt
  18,

  // SHIFT
  16,

  // CONTROL
  17
]

export function isModifierKey(keyCode: number) {
  return MODIFIER_KEYS.has(keyCode)
}

export function isCommonModifierKey(keyCode: number) {
  return COMMON_MODIFIER_KEY.includes(keyCode)
}
