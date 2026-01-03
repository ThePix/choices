//---------------------------------------------------------------------------------
// Code


/*
STATE
  
An array of variables
Each variable_state has:
  name
  value
  
An array of visited_passages
Each visited_passages has
  name
  count
  
current_passage
  name
*/

const visited_passages = {}
let current_passage

const log = console.log


function toID(name) {
  return name.replace(/[^a-zA-Z0-9]/, '_')
}

function find_variable_or_null(name) {
  for (const el of variables) {
    if (el.name === name) return el
  }
  return null
}

function find_variable(name) {
  const vari = find_variable_or_null(name)
  if (vari) return vari
  
  console.error("Failed to find a variable called '" + name + "'. This will not go well...")
  console.error(variables)
  return null
}

function add_variable(name, value, list) {
  if (list === true) {
    variables.push({name:name, value:value, money:true})
  }
  else {
    variables.push({name:name, value:value, list:list})
  }
}

function set_variable(name, value) {
  const variable = find_variable(name)
  variable.value = value
}

function get_variable(name, value) {
  const variable = find_variable(name)
  return variable.value
}



function find_passage(name) {
  for (const el of passages) {
    if (el.name === name || toID(el.name) === name) return el
  }
  console.error("Failed to find a passage called '" + name + "'. This will not go well...")
  return null
}

function find_choice(passage, name) {
  for (const el of passage.choice_list) {
    if (el.name === name || toID(el.name) === name) return el
  }
  console.error("Failed to find a choice called '" + name + "' in the passage called '" + passage.name + "'. This will not go well...")
  return null
}



function displayMoney(n) {
  if (typeof money_format === "undefined") throw "No format for money set ."
  const ary = money_format.split("!");
  if (ary.length === 2) {
    return money_format.replace("!", "" + n);
  }
  else if (ary.length === 3) {
    const negative = (n < 0)
    n = Math.abs(n);
    let options = ary[1]
    const showsign = options.startsWith("+")
    if (showsign) {
      options = options.substring(1);
    }
    let number = displayNumber(n, options)
    if (negative) {
      number = "-" + number;
    }
    else if (n !== 0 && showsign) {
      number = "+" + number;
    }
    return (ary[0] + number + ary[2]);
  }
  else if (ary.length === 4) {
    const options = n < 0 ? ary[2] : ary[1];
    return ary[0] + displayNumber(n, options) + ary[3];
  }
  else {
    errormsg ("money_format expected to have either 1, 2 or 3 exclamation marks.")
    return "" + n;
  }
}

// Returns the given number as a string formatted as per the control string.
// The control string is made up of five parts.
// The first is a sequence of characters that are not digits that will be added to the start of the string, and is optional.
// The second is a sequence of digits and it the number of characters left of the decimal point; this is padded with zeros to make it longer.
// The third is a single non-digit character; the decimal marker.
// The fourth is a sequence of digits and it the number of characters right of the decimal point; this is padded with zeros to make it longer.
// The fifth is a sequence of characters that are not digits that will be added to the end of the string, and is optional.
function displayNumber(n, control) {
  n = Math.abs(n);  // must be positive
  const regex = /^(\D*)(\d+)(\D)(\d*)(\D*)$/;
  if (!regex.test(control)) throw "Unexpected format in displayNumber (" + control + "). Should be a number, followed by a single character separator, followed by a number."
  const options = regex.exec(control);
  const places = parseInt(options[4]);                      // eg 2
  let padding = parseInt(options[2]);             // eg 3
  if (places > 0) {
    // We want a decimal point, so the padding, the total length, needs that plus the places
    padding = padding + 1 + places;               // eg 6
  }
  const factor = Math.pow (10, places)            // eg 100
  const base = (n / factor).toFixed(places);      // eg "12.34"
  const decimal = base.replace(".", options[3])   // eg "12,34"
  return (options[1] + decimal.padStart(padding, "0") + options[5])   // eg "(012,34)"
}



// Unit tested!
function get_value(s) {
  const match = s.match(/^(random|die)\((\d+)\)/)
  if (match) {
    const max = parseInt(match[2])
    const value = Math.floor(Math.random() * max)
    return match[1] = 'die' ? value + 1 : value
  }

  if (s === 'true') return true
  if (s === 'false') return false
  if (s.match(/^-?\d+$/)) return parseInt(s)
  if (s.match(/^\".*\"/)) return s.slice(1, -1)
  if (s.match(/^\'.*\'/)) return s.slice(1, -1)
  const vari = find_variable_or_null(s)
  if (vari) return vari.value
  console.error("Failed to understand a value '" + s + "'. This will not go well...")
  return null
}


function test_greater_than(a, b) {
  if (typeof a == 'string') {
    if (typeof a != 'string') throw "Mismatching comparison"
    return a.includes(b)
  }
  else if (typeof a == 'number') {
    if (typeof a != 'number') throw "Mismatching comparison"
    return a > b
  }
  else {
    throw "Unsupported comparison"
  }
}

/*
script might look like this:
  count>5 demolished
*/
// Unit tested!
function test_fragment(script) {
  script = script.trim()
  let match
  
  match = script.match(/^%(\d+)/)
  if (match) {
    value = parseInt(match[1])
    return (Math.random() * 100 < value)
  }
  
  match = script.match(/(\w+)([=\<\>!]+)(.+)/)
  if (match) {
    const left_value = get_value(match[1])
    const right_value = get_value(match[3])
    switch (match[2]) {
      case "=":
      case "==":
      case "===":
        return (left_value == right_value)
      case "!=":
      case "!==":
      case "<>":
        return (left_value != right_value)
      case "<":
        return test_greater_than(right_value, left_value)
      case ">":
        return test_greater_than(left_value, right_value)
      default:
        throw "Not sure what to do with '" + match[2] + "' in a comparison."
    }
  }
  else {
    let inverted = false
    if (script.match(/^[!~]/)) {
      inverted = true
      script = script.substring(1)
    }
    const variable = find_variable(script)
    if (!variable) return null
    
    let flag
    if (typeof variable.value == 'number') flag = (variable.value != 0)
    if (typeof variable.value == 'string') flag = (variable.value.length != 0)
    if (typeof variable.value == 'boolean') flag = variable.value
    if (inverted) flag = !flag
    return flag
  }

}

function test_script(script, isAnd) {
  const fragments = script.split(' ').filter(function(e){return e})
  let count = 0
  for (fragment of fragments) {
    if (test_fragment(fragment)) {
      count += 1
    }
  }
  if (isAnd) return (count === fragments.length)
  return count > 0
}

function test_choice_visible(link) {
  if (link.or) {
    if (!test_script(link.or, false)) {
      return false 
    }
  }
  if (link.and) {
    if (!test_script(link.and, true)) {
      return false
    }
  }
  return true    
}

/*

a=b
a=5
a=true
a="hat"
a+=1
a-=20

*/

function run_fragment(script) {
  script = script.trim()
  const match = script.match(/^(\w+)([+-]?=)(.+)/)
  if (match) {
    const variable = find_variable(match[1])
    const right_value = get_value(match[3])
    if (typeof right_value !== typeof variable.value) throw "Type mismatch"
    switch (match[2]) {
      case "=":
        variable.value = right_value
        break
      case "+=":
        variable.value += right_value
        break
      case "-=":
        variable.value -= right_value
        break
    }
    return
  }
  
  throw "Not sure what to do with: " + script
}


function run_script(script) {
  script = script.trim()
  let match
  
  match = script.match(/^all ?\((.+)\) ?(.+?) else (.+)/)
  if (match) {
    if (test_script(match[1], true)) {
      run_script(match[2])
    }
    else {
      run_script(match[3])
    }
    return
  }
  
  match = script.match(/^any ?\((.+)\) ?(.+?) else (.+)/)
  if (match) {
    if (test_script(match[1], false)) {
      run_script(match[2])
    }
    else {
      run_script(match[3])
    }
    return
  }
  
  match = script.match(/^all ?\((.+)\) ?(.+)/)
  if (match) {
    if (test_script(match[1], true)) {
      run_script(match[2])
    }
    return
  }
  
  match = script.match(/^any ?\((.+)\) ?(.+)/)
  if (match) {
    if (test_script(match[1], false)) {
      run_script(match[2])
    }
    return
  }
  
  const fragments = script.split(';').filter(function(e){return e})
  for (fragment of fragments) {
    run_fragment(fragment)
  }
}


function insert_values(s) {
  for (const el of variables) {
    let value = el.value
    if (el.money) {
      value = displayMoney(value)
    }
    if (typeof value == 'boolean' && el.list) {
      value = value ? el.list[1] : el.list[0]
    }
    if (typeof value == 'number' && el.list && value >= 0 && value < el.list.length) {
      value = el.list[value]
    }
    s = s.replaceAll('$' + el.name, value)
  }
  return s
}

// print set if include

function process_text(s) {
  const fragments = s.split('<<')
  let result = fragments.shift()
  const stack = []
  while (fragments.length) {
    fragment = fragments.shift()
    const halves = fragment.split('>>')
    if (halves.length != 2) throw "Cannot cope with : " + fragment
    
    if (halves[0].startsWith('set')) {
      const script = halves[0].substring(4)
      run_script(script)
      result += halves[1]
    }
    
    else if (halves[0].startsWith('log')) {
      log(insert_values(halves[0].substring(4)))
      result += halves[1]
    }
    
    else if (halves[0].startsWith('include')) {
      const passage_name = halves[0].substring(8).trim()
      result += find_passage(passage_name).text
      result += halves[1]
    }
    
    
    /*
    The big problem is nesting...
    */
    
    else if (halves[0].startsWith('if')) {
      const script = halves[0].substring(3)
      const cond = test_script(script)    
      stack.push({done:cond, active:cond})
      if (cond) result += halves[1]
    }
    
    else if (halves[0].startsWith('elseif')) {
      const last = stack[stack.length - 1]
      if (!last.done) {
        const script = halves[0].substring(7)
        const cond = test_script(script)    
        if (cond) {
          result += halves[1]
          last.done = true
          last.active = true
        }
        else {
          last.active = false
        }
      }
    }
    
    else if (halves[0] == 'else') {
      const last = stack[stack.length - 1]
      if (!last.done) {
        result += halves[1]
        last.done = true
        last.active = true
      }
    }
    
    else if (halves[0].startsWith('/if')) {
      stack.pop()
      result += halves[1]
    }
    
    
    else {
      throw "Unrecognised directive in: " + s
    }
  
  }
  if (result.includes('<<')) result = process_text(result)  // in case include has added anything
  

  
  return insert_values(result)
}




let assert_count = 0
let fail_count = 0

function assert(flag1, flag2) {
  assert_count += 1
  if (flag1 != flag2) {
    log("##### FAILED #####")
    log("Assert failed (" + flag1 + " vs " + flag2 + ")")
    console.trace()
    fail_count += 1
  }
}


function assert_v(var1, flag2) {
  assert(find_variable(var1).value, flag2)
}


function unittest() {

  // setup
  add_variable('unittest0', 427, true)
  add_variable('unittest1', 0)
  add_variable('unittest2', 4, ['red', 'blue', 'green', 'yellow'])
  add_variable('unittest3', "")
  add_variable('unittest4', "MyTest")
  add_variable('unittest5', false, ['no', 'yes'])
  add_variable('unittest6', true)

  // --- get_value ---
  assert(get_value('unittest2'), 4)
  assert(get_value('unittest3'), "")
  assert(get_value('""'), "")
  assert(get_value('"test"'), "test")
  assert(get_value('14'), 14)
  assert(get_value('true'), true)
  assert(get_value('false'), false)
  
  assert(test_greater_than(3, 4), false)
  assert(test_greater_than(3, 3), false)
  assert(test_greater_than(3, 2), true)
  assert(test_greater_than('str', 'str'), true)
  assert(test_greater_than('substring', 'str'), true)
  assert(test_greater_than('str', 'substring'), false)
  
  // --- test_fragment ---
  assert(test_fragment('!unittest1'), true)
  assert(test_fragment('unittest2'), true)
  assert(test_fragment('!unittest3'), true)
  assert(test_fragment('unittest4'), true)
  assert(test_fragment('!unittest5'), true)
  assert(test_fragment('unittest6'), true)

  assert(test_fragment('unittest1=0'), true)
  assert(test_fragment('unittest1=2'), false)
  assert(test_fragment('unittest1!=0'), false)
  assert(test_fragment('unittest1!=4'), true)

  assert(test_fragment('unittest2<>0'), true)
  assert(test_fragment('unittest2!==4'), false)
  assert(test_fragment('unittest2=0'), false)
  assert(test_fragment('unittest2===4'), true)
  assert(test_fragment('unittest2<5'), true)
  assert(test_fragment('unittest2<4'), false)
  assert(test_fragment('unittest2>4'), false)
  assert(test_fragment('unittest2>3'), true)

  assert(test_fragment('unittest3<>"MyTest"'), true)
  assert(test_fragment('unittest3!==""'), false)
  assert(test_fragment('unittest3="MyTest"'), false)
  assert(test_fragment('unittest3===""'), true)

  assert(test_fragment('unittest4<>"MyTest"'), false)
  assert(test_fragment('unittest4!==""'), true)
  assert(test_fragment('unittest4="MyTest"'), true)
  assert(test_fragment('unittest4===""'), false)
  assert(test_fragment('unittest4<"MyTest"'), true)
  assert(test_fragment('unittest4<"fgfMyTestdhjfgh"'), true)
  assert(test_fragment('unittest4<"fgfMyestdhjfgh"'), false)
  assert(test_fragment('unittest4>"MyTest"'), true)
  assert(test_fragment('unittest4>"Test"'), true)
  assert(test_fragment('unittest4>"T3est"'), false)

  // --- test_script ---
  assert(test_script('unittest4===""', true), false)
  assert(test_script('unittest4=="MyTest"', true), true)
  assert(test_script('unittest4==="MyTest" unittest5', true), false)  // one is false so fails for AND
  assert(test_script('unittest4==="MyTest" unittest5', false), true)  // but passes for OR
  
  assert(test_script('unittest4==="MyTest" unittest6 unittest4', true), true)
  assert(test_script('unittest4==="MyTest" unittest5 unittest4', true), false)
  assert(test_script('unittest4==="MyTest2" unittest5 unittest4', false), true)


  // --- run_fragment ---
  run_fragment('unittest4="Other"')
  assert_v('unittest4', "Other")

  run_fragment('unittest2=19')
  assert_v('unittest2', 19)
  run_fragment('unittest2+=5')
  assert_v('unittest2', 24)
  run_fragment('unittest2-=2')
  assert_v('unittest2', 22)
  run_fragment('unittest2=-16')
  assert_v('unittest2', -16)

  run_fragment('unittest6=false')
  assert_v('unittest6', false)
  

  // --- run_script ---
  run_script('unittest2=19; unittest1=3')
  assert_v('unittest2', 19)
  assert_v('unittest1', 3)

  set_variable('unittest5', false)
  set_variable('unittest6', true)
  run_script('all (unittest6) unittest2=19')
  assert_v('unittest2', 19)
  run_script('all (!unittest6) unittest2=43')
  assert_v('unittest2', 19)
  run_script('all (!unittest5) unittest2=46')
  assert_v('unittest2', 46)

  run_script('all (!unittest5 unittest1=3) unittest2=47')
  assert_v('unittest2', 47)
  run_script('all (unittest5 unittest1=3) unittest2=48')
  assert_v('unittest2', 47)
  run_script('any (unittest5 unittest1=3) unittest2=48')
  assert_v('unittest2', 48)
  
  run_script('all (!unittest5 unittest1=3) unittest2=60 else unittest2=70')
  assert_v('unittest2', 60)
  run_script('all (unittest5 unittest1=3) unittest2=60 else unittest2=70')
  assert_v('unittest2', 70)



  
  // --- process_text ---
  let s, result
  s = 'Here is some text.<<set unittest2=-7; unittest3="some text">> More text.'
  result = process_text(s)
  assert(result, 'Here is some text. More text.')
  assert_v('unittest2', -7)
  assert_v('unittest3', "some text")
  
  set_variable('unittest2', -7)
  s = 'Here is some text.<<if unittest2=-7>> More text.<</if>>'
  result = process_text(s)
  assert(result, 'Here is some text. More text.')
  set_variable('unittest2', 19)
  result = process_text(s)
  assert(result, 'Here is some text.')
  
  set_variable('unittest2', -7)
  s = 'Here is some text.<<if unittest2=-7>> More text.<<else>> Other text.<</if>>'
  result = process_text(s)
  assert(result, 'Here is some text. More text.')
  set_variable('unittest2', 19)
  result = process_text(s)
  assert(result, 'Here is some text. Other text.')
  
  set_variable('unittest2', -7)
  set_variable('unittest4', 'blue')
  s = 'Here is some text.<<if unittest2=-7>> More text.<<elseif unittest4="blue">> Blue text.<<else>> Other text.<</if>>'
  result = process_text(s)
  assert(result, 'Here is some text. More text.')
  set_variable('unittest2', 19)
  result = process_text(s)
  assert(result, 'Here is some text. Blue text.')
  set_variable('unittest4', 'red')
  result = process_text(s)
  assert(result, 'Here is some text. Other text.')
  
  // --- process_text (if) ---
  set_variable('unittest1', 4)
  set_variable('unittest2', -7)
  set_variable('unittest4', 'blue')
  s = 'Here is some text.<<if unittest2=-7>><<if unittest1=4>> More<<else>> Less<</if>> text.<<elseif unittest4="blue">> Blue text.<<else>> Other text.<</if>>'
  result = process_text(s)
  assert(result, 'Here is some text. More text.')
  
  set_variable('unittest1', 0)
  result = process_text(s)
  assert(result, 'Here is some text. Less text.')
  
  // --- process_text ($) ---
  set_variable('unittest1', 4)
  set_variable('unittest2', 3)
  set_variable('unittest4', 'blue')
  s = 'The value is $unittest1. It is still $unittest1. $unittest4'
  result = process_text(s)
  assert(result, 'The value is 4. It is still 4. blue')

  s = 'The colour is $unittest2.'
  result = process_text(s)
  assert(result, 'The colour is yellow.')
  set_variable('unittest2', -1)
  result = process_text(s)
  assert(result, 'The colour is -1.')
  set_variable('unittest2', 4)
  result = process_text(s)
  assert(result, 'The colour is 4.')

  set_variable('unittest5', true)
  s = 'He says $unittest5.'
  result = process_text(s)
  assert(result, 'He says yes.')

  s = 'The value is $unittest0.'
  result = process_text(s)
  assert(result, 'The value is $4.27.')

  
  // --- test_choice_visible ---
  set_variable('unittest1', 4)
  set_variable('unittest2', -7)
  set_variable('unittest4', 'blue')
  link = {}
  assert(test_choice_visible(link), true)
  link = {or:'unittest1=4'}
  assert(test_choice_visible(link), true)
  link = {or:'unittest1=5'}
  assert(test_choice_visible(link), false)
  link = {or:'unittest1=5 unittest4!="blue"'}
  assert(test_choice_visible(link), false)
  link = {or:'unittest1=5 unittest4="blue"'}
  assert(test_choice_visible(link), true)

  link = {and:'unittest1=5 unittest4="blue"'}
  assert(test_choice_visible(link), false)
  link = {and:'unittest1<5 unittest4="blue"'}
  assert(test_choice_visible(link), true)

  link = {and:'unittest1=5 unittest4="blue"', or:'unittest1=5 unittest4="blue"'}
  assert(test_choice_visible(link), false)
  link = {and:'unittest1<5 unittest4="blue"', or:'unittest1=5 unittest4="red"'}
  assert(test_choice_visible(link), false)
  link = {and:'unittest1<5 unittest4="blue"', or:'unittest1=5 unittest4="blue"'}
  assert(test_choice_visible(link), true)
  
  
  
  
  /*
  // Not impleented yet!
  set_variable('unittest2', 19)
  result = process_text(s)
  assert(result, 'Here is some text. Blue text.')
  set_variable('unittest4', 'red')
  result = process_text(s)
  assert(result, 'Here is some text. Other text.')*/
  
  
  

  log("Failed " + fail_count + " out of " + assert_count + " tests.")
}




function choiceToHTML(passage, choice) {
  if (!test_choice_visible(choice)) return ''

  let html = ''
  html += '<li><span class="choice" style="cursor: pointer" id="'
  html += toID(choice.name)
  html += '">'
  html += choice.text ? choice.text : choice.name
  html += '</span></li>'
  return html
}


function click(event) {
  const passage = find_passage(current_passage)
  const choice = find_choice(passage, event.target.id)
  
  if (choice.script) run_script(choice.script)
  
  const new_passage = find_passage(choice.name)
  visit(new_passage) 
}


function visit(passage) {
  current_passage = passage.name
  if (passage.name in visited_passages) {
    visited_passages[passage.name] += 1
  }
  else {
    visited_passages[passage.name] = 1
  }
  
  const text = process_text(passage.text)
  
  if (!passage.portal) {
    div=document.getElementById('outer')
    div.classList.remove(div.classList[0])
    div.classList.add(passage.css_class ? passage.css_class : 'default')
    
    const title_div = document.getElementById('heading')
    if (passage.title) {
      title_div.innerHTML = passage.title
      title_div.style.display = 'block'
    }
    else {
      title_div.style.display = 'none'
    }
    const passage_div = document.getElementById('passage')
    passage_div.innerHTML = text
  
    const choices_div = document.getElementById('choices')
    if (passage.choice_list && passage.choice_list.length) {
      let html = '<ul>'
      for (const el of passage.choice_list) {
        html += choiceToHTML(passage, el)
      }  
      html += '</ul>'
      choices_div.innerHTML = html
      choices_div.style.display = 'block'
      
      const choice_divs = document.getElementsByClassName('choice')
      for (const el of choice_divs) {
        el.addEventListener("click", click)
      }  

    }
    else {
      choices_div.style.display = 'none'
      // presumable the end of the game!!
    }
  }
  
  
  else {
    for (const el of passage.choice_list) {
      if (test_choice_visible(passage, el)) {
        const new_passage = find_passage(el.name)
        visit(new_passage)
        return
      }
    }  
  }
}


function init() {
  const h1 = document.getElementById('title')
  h1.innerHTML = title
  document.title = title

  visit(find_passage(starting_passage))
  unittest()
}