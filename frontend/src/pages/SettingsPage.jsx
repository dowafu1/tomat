import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Field, { PasswordInput } from '../components/Field.jsx'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { initials, shortDate } from '../lib/format.js'

export default function SettingsPage() {
  const {
    user,
    updateProfile,
    changePassword,
    deleteAccount,
    logout,
    token,
  } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.display_name || '')
  const [nameError, setNameError] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const notificationsSupported =
    typeof window !== 'undefined' && 'Notification' in window
  const [permission, setPermission] = useState(
    notificationsSupported ? Notification.permission : 'unsupported'
  )

  useEffect(() => {
    document.title = 'Настройки — Фокус'
  }, [])

  useEffect(() => {
    setName(user?.display_name || '')
  }, [user?.display_name])

  async function saveProfile(event) {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) {
      setNameError('Имя не может быть пустым')
      return
    }
    setNameError('')
    setSavingName(true)
    try {
      await updateProfile(clean)
      toast.push({ tone: 'success', title: 'Профиль обновлён' })
    } catch (requestError) {
      setNameError(requestError.message)
    } finally {
      setSavingName(false)
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    const errors = {}
    if (!currentPassword) errors.current = 'Введите текущий пароль'
    if (!newPassword) errors.new = 'Придумайте новый пароль'
    else if (newPassword.length < 8) errors.new = 'Минимум 8 символов'
    else if (new TextEncoder().encode(newPassword).length > 72)
      errors.new = 'Максимум 72 байта'
    else if (newPassword === currentPassword)
      errors.new = 'Новый пароль должен отличаться от текущего'
    if (confirmPassword !== newPassword) errors.confirm = 'Пароли не совпадают'
    setPasswordErrors(errors)
    setPasswordError('')
    if (Object.keys(errors).length) return

    setSavingPassword(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.push({
        tone: 'success',
        title: 'Пароль обновлён',
        text: 'Остальные сессии на других устройствах завершены.',
      })
    } catch (requestError) {
      setPasswordError(requestError.message)
    } finally {
      setSavingPassword(false)
    }
  }

  async function requestNotifications() {
    if (!notificationsSupported) return
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') {
        toast.push({
          tone: 'success',
          title: 'Уведомления включены',
          text: 'Сообщим, когда фокус или перерыв завершится.',
        })
        new Notification('Фокус', {
          body: 'Уведомления работают. Хорошей сессии.',
          icon: '/favicon.svg',
        })
      } else if (result === 'denied') {
        toast.push({
          tone: 'info',
          title: 'Уведомления отключены',
          text: 'Разрешение можно изменить в настройках браузера.',
        })
      }
    } catch (requestError) {
      toast.push({
        tone: 'error',
        title: 'Не удалось запросить разрешение',
        text: requestError.message,
      })
    }
  }

  async function confirmDelete() {
    if (!deletePassword) {
      setDeleteError('Введите пароль, чтобы подтвердить удаление')
      return
    }
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteAccount(deletePassword)
      toast.push({
        tone: 'info',
        title: 'Аккаунт удалён',
        text: 'Все задачи и сессии удалены без возможности восстановления.',
      })
      navigate('/login', { replace: true })
    } catch (requestError) {
      setDeleteError(requestError.message)
    } finally {
      setDeleting(false)
    }
  }

  function signOut() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="settings">
      <div className="page-head settings__intro">
        <div className="page-head__main">
          <p className="eyebrow">Настройки</p>
          <h1>Аккаунт и безопасность.</h1>
          <p className="page-head__text">
            Имя, пароль и уведомления. Данные аккаунта хранятся на сервере в
            PostgreSQL.
          </p>
        </div>
      </div>

      <section className="panel settings-section" aria-labelledby="profile-heading">
        <div className="settings-section__head">
          <h2 className="settings-section__title" id="profile-heading">
            Профиль
          </h2>
          <p className="settings-section__text">
            Так вас будут приветствовать на главной странице.
          </p>
        </div>
        <div className="settings-section__body">
          <div className="profile-line">
            <span className="avatar avatar--lg">{initials(user?.display_name)}</span>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 650 }}>{user?.display_name}</p>
              <p className="settings-row__meta">{user?.email}</p>
            </div>
          </div>

          <form className="settings-form" onSubmit={saveProfile} noValidate>
            <Field label="Имя" htmlFor="settings-name" error={nameError}>
              <div className="field__control">
                <Icon name="user" size={16} className="input-icon" />
                <input
                  id="settings-name"
                  className="input input--with-icon"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    if (nameError) setNameError('')
                  }}
                  maxLength={80}
                  autoComplete="name"
                  data-testid="settings-name"
                />
              </div>
            </Field>

            <Field
              label="Email для входа"
              htmlFor="settings-email"
              hint="Email используется как логин. Он не отображается другим пользователям."
            >
              <input
                id="settings-email"
                className="input"
                value={user?.email || ''}
                readOnly
                disabled
              />
            </Field>

            <div className="settings-actions">
              <Button
                type="submit"
                variant="primary"
                loading={savingName}
                disabled={name.trim() === (user?.display_name || '')}
                data-testid="settings-save-name"
              >
                Сохранить имя
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="panel settings-section" aria-labelledby="security-heading">
        <div className="settings-section__head">
          <h2 className="settings-section__title" id="security-heading">
            Пароль
          </h2>
          <p className="settings-section__text">
            После смены пароля все остальные активные сессии станут недействительными.
          </p>
        </div>
        <div className="settings-section__body">
          {passwordError ? (
            <div className="alert alert--error" role="alert">
              <Icon name="alert" size={16} className="alert__icon" />
              <div className="alert__body">{passwordError}</div>
            </div>
          ) : null}

          <form className="settings-form" onSubmit={savePassword} noValidate>
            <Field
              label="Текущий пароль"
              htmlFor="current-password"
              error={passwordErrors.current}
            >
              <PasswordInput
                id="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Текущий пароль"
              />
            </Field>

            <Field
              label="Новый пароль"
              htmlFor="new-password"
              error={passwordErrors.new}
              hint="Минимум 8 символов"
            >
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Новый пароль"
                data-testid="settings-new-password"
              />
            </Field>

            <Field
              label="Повторите новый пароль"
              htmlFor="confirm-password"
              error={passwordErrors.confirm}
            >
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Ещё раз"
              />
            </Field>

            <div className="settings-actions">
              <Button
                type="submit"
                variant="primary"
                loading={savingPassword}
                data-testid="settings-save-password"
              >
                Обновить пароль
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="panel settings-section" aria-labelledby="notify-heading">
        <div className="settings-section__head">
          <h2 className="settings-section__title" id="notify-heading">
            Уведомления
          </h2>
          <p className="settings-section__text">
            Браузерное уведомление, когда фокус или перерыв завершён.
          </p>
        </div>
        <div className="settings-section__body">
          <div className="settings-row">
            <div className="settings-row__text">
              <p className="settings-row__title">Уведомления в браузере</p>
              <p className="settings-row__meta">
                {!notificationsSupported
                  ? 'Этот браузер не поддерживает уведомления.'
                  : permission === 'granted'
                    ? 'Разрешены. Работают, пока вкладка открыта.'
                    : permission === 'denied'
                      ? 'Запрещены в настройках браузера.'
                      : 'Разрешение ещё не выдано.'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={requestNotifications}
              disabled={!notificationsSupported || permission === 'denied'}
              icon="bell"
            >
              {permission === 'granted' ? 'Проверить' : 'Включить'}
            </Button>
          </div>
        </div>
      </section>

      <section className="panel settings-section" aria-labelledby="session-heading">
        <div className="settings-section__head">
          <h2 className="settings-section__title" id="session-heading">
            Аккаунт и данные
          </h2>
          <p className="settings-section__text">
            Аккаунт создан {user?.created_at ? shortDate(user.created_at) : '—'}.
            Задачи и сессии доступны только вам.
          </p>
        </div>
        <div className="settings-section__body">
          <div className="settings-row">
            <div className="settings-row__text">
              <p className="settings-row__title">Выйти из аккаунта</p>
              <p className="settings-row__meta">
                Локальный токен будет удалён с этого устройства.
              </p>
            </div>
            <Button variant="secondary" size="sm" icon="logout" onClick={signOut}>
              Выйти
            </Button>
          </div>
          <div className="settings-row">
            <div className="settings-row__text">
              <p className="settings-row__title">Хранилище</p>
              <p className="settings-row__meta">
                PostgreSQL · защищённое подключение через backend API
                {token ? ' · сессия активна' : ''}
              </p>
            </div>
            <span className="badge badge--accent">
              <Icon name="database" size={12} />
              PostgreSQL
            </span>
          </div>
        </div>
      </section>

      <section
        className="panel settings-section danger-zone"
        aria-labelledby="danger-heading"
      >
        <div className="settings-section__head">
          <h2 className="settings-section__title" id="danger-heading">
            Удаление аккаунта
          </h2>
          <p className="settings-section__text">
            Необратимо удалит аккаунт, все задачи, сессии и статистику.
          </p>
        </div>
        <div className="settings-section__body">
          <div className="settings-row">
            <div className="settings-row__text">
              <p className="settings-row__title">Удалить аккаунт и данные</p>
              <p className="settings-row__meta">
                Потребуется подтверждение паролем.
              </p>
            </div>
            <Button
              variant="danger-ghost"
              size="sm"
              icon="trash"
              onClick={() => {
                setDeletePassword('')
                setDeleteError('')
                setDeleteOpen(true)
              }}
            >
              Удалить аккаунт
            </Button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={deleteOpen}
        title="Удалить аккаунт?"
        text="Это действие нельзя отменить. Все задачи и история фокус-сессий будут удалены."
        confirmLabel="Удалить навсегда"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!deleting) setDeleteOpen(false)
        }}
      >
        <Field
          label="Пароль"
          htmlFor="delete-password"
          error={deleteError}
          hint="Введите пароль, чтобы подтвердить действие."
        >
          <PasswordInput
            id="delete-password"
            value={deletePassword}
            onChange={(event) => {
              setDeletePassword(event.target.value)
              if (deleteError) setDeleteError('')
            }}
            autoComplete="current-password"
            placeholder="Ваш пароль"
            data-autofocus
          />
        </Field>
      </ConfirmDialog>
    </div>
  )
}
