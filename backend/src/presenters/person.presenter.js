export function presentPerson(person) {
  return {
    id: person.id,
    user_id: person.user_id,
    name: person.name,
    birthday: person.birthday,
    priority: person.priority,
    custom_fields: person.custom_fields,
    is_owner: person.is_owner,
    created_at: person.created_at,
  }
}

export function presentPersonList(persons) {
  return persons.map(presentPerson)
}
