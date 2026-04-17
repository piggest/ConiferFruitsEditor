import { app, Menu, BrowserWindow } from 'electron';

// ネイティブアプリメニューを構築して登録する
export function buildAppMenu(getMainWindow: () => BrowserWindow | null) {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' } as const,
        { type: 'separator' } as const,
        {
          label: 'ログアウト',
          click: () => getMainWindow()?.webContents.send('menu:logout'),
        },
        { type: 'separator' } as const,
        { role: 'services' } as const,
        { type: 'separator' } as const,
        { role: 'hide' } as const,
        { role: 'hideOthers' } as const,
        { role: 'unhide' } as const,
        { type: 'separator' } as const,
        { role: 'quit' } as const,
      ],
    }] : []),
    {
      label: '編集',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: '表示',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    ...(!isMac ? [{
      label: 'アカウント',
      submenu: [{
        label: 'ログアウト',
        click: () => getMainWindow()?.webContents.send('menu:logout'),
      }],
    }] : []),
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template as any));
}
