export const validationMessages = {
  default: 'Erro de validação no campo ${label}',
  required: 'Por favor, insira ${label}',
  enum: '${label} deve ser um dos seguintes: ${enum}',
  whitespace: '${label} não pode ser um campo vazio',
  date: {
    format: '${label} é inválido para o formato de data',
    parse: '${label} não pôde ser analisado como data',
    invalid: '${label} é uma data inválida',
  },
  types: {
    string: '${label} não é um ${type} válido',
    method: '${label} não é um ${type} válido (função)',
    array: '${label} não é um ${type} válido',
    object: '${label} não é um ${type} válido',
    number: '${label} não é um ${type} válido',
    date: '${label} não é um ${type} válido',
    boolean: '${label} não é um ${type} válido',
    integer: '${label} não é um ${type} válido',
    float: '${label} não é um ${type} válido',
    regexp: '${label} não é um ${type} válido',
    email: '${label} não é um email válido',
    url: '${label} não é uma URL válida',
    hex: '${label} não é um hexadecimal válido',
  },
  string: {
    len: '${label} deve ter exatamente ${len} caracteres',
    min: '${label} deve ter pelo menos ${min} caracteres',
    max: '${label} não pode ter mais de ${max} caracteres',
    range: '${label} deve ter entre ${min} e ${max} caracteres',
  },
  number: {
    len: '${label} deve ser igual a ${len}',
    min: '${label} não pode ser menor que ${min}',
    max: '${label} não pode ser maior que ${max}',
    range: '${label} deve estar entre ${min} e ${max}',
  },
  array: {
    len: '${label} deve ter exatamente ${len} itens',
    min: '${label} deve ter pelo menos ${min} itens',
    max: '${label} não pode ter mais de ${max} itens',
    range: '${label} deve ter entre ${min} e ${max} itens',
  },
  pattern: {
    mismatch: '${label} não corresponde ao padrão ${pattern}',
  },
};

