import { formatAmount, formatDate, t } from '../../i18n/index.js'
import { PaymentStatusBadge } from '../../components/ui/Badge.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Pagos.
 *
 * CERRADA AL PROFESOR: lleva `amount`. Es la tercera de las tres entidades con
 * campos monetarios que el servidor le veda.
 *
 * La matrícula debe pertenecer al alumno elegido; el servidor lo valida y
 * devuelve el error sobre ese campo. La interfaz no lo replica: duplicar una
 * regla de negocio en el cliente es garantizar que las dos se desincronicen.
 */
export function PaymentsPage() {
  return (
    <ResourcePage
      columns={[
        { key: 'student.full_name', label: t('fields.student') },
        { key: 'period_label', label: t('payments.fields.period') },
        {
          key: 'amount',
          label: t('payments.fields.amount'),
          // Separador de millar y dos decimales, nunca número desnudo (SC-010).
          render: (record) => <span className="tabular">{formatAmount(record.amount)}</span>,
        },
        {
          key: 'paid_at',
          label: t('payments.fields.paidAt'),
          render: (record) => formatDate(record.paid_at),
        },
        {
          key: 'payment_method',
          label: t('payments.fields.method'),
          render: (record) => t(`paymentMethod.${record.payment_method}`),
        },
        {
          key: 'status',
          label: t('fields.status'),
          render: (record) => <PaymentStatusBadge value={record.status} />,
        },
      ]}
      emptyBody={t('payments.emptyBody')}
      emptyTitle={t('payments.emptyTitle')}
      fields={[
        {
          name: 'student_id',
          label: t('fields.student'),
          type: 'relation',
          endpoint: 'students',
          optionLabel: (student) => student.full_name,
          required: true,
        },
        {
          name: 'enrollment_id',
          label: t('fields.enrollment'),
          type: 'relation',
          endpoint: 'enrollments',
          optionLabel: (enrollment) => [
            enrollment.student?.full_name,
            enrollment.class_group?.name,
          ].filter(Boolean).join(' — '),
          hint: t('payments.fields.enrollmentHint'),
        },
        {
          name: 'amount',
          label: t('payments.fields.amount'),
          type: 'number',
          required: true,
        },
        {
          name: 'period_label',
          label: t('payments.fields.period'),
          required: true,
          hint: t('payments.fields.periodHint'),
        },
        {
          name: 'paid_at',
          label: t('payments.fields.paidAt'),
          type: 'date',
          required: true,
        },
        {
          name: 'payment_method',
          label: t('payments.fields.method'),
          type: 'select',
          required: true,
          defaultValue: 'cash',
          options: [
            { value: 'cash', label: t('paymentMethod.cash') },
            { value: 'card', label: t('paymentMethod.card') },
            { value: 'transfer', label: t('paymentMethod.transfer') },
          ],
        },
        {
          name: 'status',
          label: t('fields.status'),
          type: 'select',
          required: true,
          defaultValue: 'paid',
          options: [
            { value: 'paid', label: t('paymentStatus.paid') },
            { value: 'pending', label: t('paymentStatus.pending') },
            { value: 'cancelled', label: t('paymentStatus.cancelled') },
          ],
        },
        {
          name: 'guardian_id',
          label: t('fields.guardian'),
          type: 'relation',
          endpoint: 'guardians',
          optionLabel: (guardian) => guardian.full_name,
        },
        { name: 'reference', label: t('payments.fields.reference') },
        { name: 'notes', label: t('fields.notes'), type: 'textarea' },
      ]}
      getRecordName={(record) => [
        record.student?.full_name,
        record.period_label,
      ].filter(Boolean).join(' — ')}
      section="payments"
    />
  )
}
