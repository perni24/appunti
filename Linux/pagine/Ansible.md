---
date: 2026-07-13
area: Linux
topic: Automazione con Ansible
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, ansible, automazione, configuration-management, yaml]
aliases: [Ansible playbook, Configuration management con Ansible]
prerequisites: [SSH, Bash scripting, Principio del minimo privilegio]
related: [Variabili e configurazione, Script robusti, Server SSH]
---

# Ansible

## Sintesi

Ansible automatizza configurazione, deployment e orchestrazione descrivendo host e stato desiderato in inventory e playbook YAML. Il control node esegue moduli sui managed node, normalmente tramite SSH su Linux, senza richiedere un agente Ansible residente.

Il vantaggio principale non e eseguire lo stesso comando su molti server, ma esprimere operazioni idempotenti, verificabili e versionate. Moduli specifici sono preferibili a `shell` e `command` perche conoscono stato, cambiamenti e check mode.

## Quando usarlo

- Configurare in modo coerente piu host Linux.
- Installare pacchetti, file, utenti e servizi.
- Eseguire rollout ordinati e limitati a gruppi di host.
- Riutilizzare configurazione tramite role e collection.
- Verificare differenze e sintassi prima di applicare modifiche.

## Come funziona

Componenti principali:

- **Inventory**: definisce host, gruppi e variabili associate, staticamente o tramite plugin dinamici.
- **Play**: associa un insieme di task a un gruppo di host.
- **Task**: invoca un modulo con parametri dichiarativi.
- **Module**: implementa un'operazione, per esempio `package`, `copy`, `user` o `service`.
- **Handler**: task eseguito su notifica quando un altro task produce un cambiamento.
- **Role**: struttura riutilizzabile per task, handler, template, file, default e variabili.
- **Collection**: namespace distribuibile di moduli, plugin e role.

Il control node legge configurazione, inventory e variabili, seleziona gli host e apre connessioni. Per molti moduli Linux il nodo remoto deve avere Python compatibile; `ansible.builtin.raw` e una eccezione utile nel bootstrap.

L'idempotenza significa che rieseguire il playbook su uno stato gia conforme non produce modifiche. Non tutti i moduli o comandi arbitrari sono idempotenti. `changed_when`, `failed_when`, `creates` e `removes` possono descrivere comportamento, ma non devono nascondere una operazione intrinsecamente non sicura.

Le variabili hanno una precedenza articolata tra configurazione, inventory, playbook, role ed extra vars. La posizione deve seguire lo scopo: default nel role, differenze per gruppo in `group_vars`, differenze per host in `host_vars`, segreti in un canale protetto.

## API / Sintassi

Mostrare versione, Python e percorsi Ansible:

```bash
ansible --version
```

Mostrare soltanto la configurazione diversa dai default:

```bash
ansible-config dump --only-changed
```

Visualizzare la struttura dell'inventory:

```bash
ansible-inventory -i inventory.yml --graph
```

Verificare connessione e Python remoto con il modulo Ansible `ping`:

```bash
ansible all -i inventory.yml -m ansible.builtin.ping
```

Controllare la sintassi di un playbook:

```bash
ansible-playbook -i inventory.yml site.yml --syntax-check
```

Simulare le modifiche e mostrare le differenze supportate:

```bash
ansible-playbook -i inventory.yml site.yml --check --diff
```

Limitare l'esecuzione a un singolo host:

```bash
ansible-playbook -i inventory.yml site.yml --limit web01.example
```

Analizzare il playbook con ansible-lint:

```bash
ansible-lint site.yml
```

Cifrare un file di variabili con Ansible Vault:

```bash
ansible-vault encrypt group_vars/all/vault.yml
```

## Esempio pratico

Inventory YAML minimo:

```yaml
all:
  children:
    web:
      hosts:
        web01.example:
        web02.example:
```

Playbook idempotente che installa Nginx, pubblica una pagina e mantiene il servizio attivo:

```yaml
---
- name: Configura i web server
  hosts: web
  become: true

  handlers:
    - name: Reload nginx
      ansible.builtin.service:
        name: nginx
        state: reloaded

  tasks:
    - name: Installa Nginx
      ansible.builtin.package:
        name: nginx
        state: present

    - name: Pubblica la pagina iniziale
      ansible.builtin.copy:
        content: "Server gestito da Ansible\n"
        dest: /var/www/html/index.html
        owner: root
        group: root
        mode: "0644"

    - name: Configura il virtual host gestito
      ansible.builtin.copy:
        content: |
          server {
              listen 8080;
              root /var/www/html;
              location / {
                  try_files $uri $uri/ =404;
              }
          }
        dest: /etc/nginx/conf.d/managed.conf
        owner: root
        group: root
        mode: "0644"
      notify: Reload nginx

    - name: Mantiene Nginx attivo e abilitato
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true
```

Verificare inventory e sintassi:

```bash
ansible-inventory -i inventory.yml --graph
```

```bash
ansible-playbook -i inventory.yml site.yml --syntax-check
```

Eseguire check e diff su un solo host prima del rollout:

```bash
ansible-playbook -i inventory.yml site.yml --check --diff --limit web01.example
```

Il check mode e una simulazione basata sul supporto dei moduli: non garantisce che l'esecuzione reale avra successo e puo non conoscere output prodotti da task saltati.

## Varianti

- I comandi ad hoc sono utili per verifiche rapide; i playbook sono versionabili e ripetibili.
- Inventory plugin dinamici interrogano cloud, CMDB o altre fonti invece di mantenere liste statiche.
- I role separano default, variabili, task, handler, template e file secondo una struttura nota.
- Le collection distribuiscono contenuti con Fully Qualified Collection Name come `ansible.builtin.copy`.
- `serial` applica un play a batch di host per rollout progressivi.
- `delegate_to` esegue un task su un host diverso dal target del play.
- Ansible Vault cifra dati a riposo; una volta decifrati, playbook e plugin devono evitare esposizione nei log.
- AWX e Automation Controller aggiungono API, scheduling, credenziali, inventory e controllo degli accessi sopra Ansible.

## Errori comuni

- Usare `ansible.builtin.shell` per operazioni coperte da un modulo idempotente.
- Presumere che check mode e diff simulino qualsiasi task con precisione.
- Collocare tutte le variabili nello stesso livello e perdere chiarezza sulla precedenza.
- Salvare password in chiaro nell'inventory o nel repository.
- Credere che Vault protegga i segreti mentre sono decifrati e usati.
- Usare `no_log: true` indiscriminatamente e rendere impossibile diagnosticare il task.
- Eseguire subito su tutti gli host senza `--limit`, batch o ambiente di test.
- Omettere FQCN e dipendere da collection o moduli omonimi inattesi.
- Rendere un task sempre `changed` e attivare handler a ogni esecuzione.
- Ignorare compatibilita tra versione di ansible-core, collection e Python remoto.

## Checklist

- Inventory e gruppi rappresentano correttamente gli host reali?
- Accesso SSH e `become` rispettano il minimo privilegio?
- Moduli specifici sostituiscono comandi shell quando possibile?
- Task e handler sono idempotenti e riportano `changed` correttamente?
- Variabili seguono uno scope e una precedenza comprensibili?
- Segreti sono cifrati a riposo e non appaiono in output o diff?
- Inventory, playbook e role superano syntax check e lint?
- Check mode viene usato conoscendone i limiti?
- Rollout parte da test, singolo host o batch controllato?
- Backup, rollback e monitoraggio verificano l'esito reale?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/SSH|SSH]]
- [[Linux/Pagine/Bash scripting|Bash scripting]]
- [[Linux/Pagine/Script robusti|Script robusti]]
- [[Linux/Pagine/Variabili e configurazione|Variabili e configurazione]]
- [[Linux/Pagine/Principio del minimo privilegio|Principio del minimo privilegio]]

## Fonti

- [Ansible playbook guide](https://docs.ansible.com/projects/ansible/latest/playbook_guide/index.html)
- [Ansible inventory guide](https://docs.ansible.com/projects/ansible/latest/inventory_guide/index.html)
- [Ansible variable precedence](https://docs.ansible.com/projects/ansible/latest/reference_appendices/general_precedence.html)
- [Ansible check mode and diff mode](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_checkmode.html)
- [Ansible Vault](https://docs.ansible.com/projects/ansible/latest/vault_guide/vault.html)
- [Ansible Lint documentation](https://ansible.readthedocs.io/projects/lint/)
