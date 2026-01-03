const title = "Choices Test"
const starting_passage = "start"
const money_format = "!$1.2!($1.2)!"
const variables = [
  {name:'cash', value:423, type:'money'},
  {name:'hat colour', value:'blue'},
]


const passages = [
  {
    name:'start',
    text:'This is a test game for <i>choices</i>.',
    choice_list:[
      {name:'Option one'},
      {name:'Option 2', text:'Option two'},
    ],
  },

  {
    name:'Option one',
    title:"The End",
    text:'This is option one for <i>choices</i>.<<log Selected portal!>>',
    portal:true,
    choice_list:[
      {name:'end'},
    ],
  },

  {
    name:'Option 2',
    text:'This is option two for <i>choices</i>. It is <<if %90>>yellow.<<else>>blue<</if>>.',
    css_class:'meta',
    choice_list:[
      {name:'start', text:'Back to start'},
    ],
  },

  {
    name:'end',
    title:"The End",
    text:'That\'s All Folks',
    choice_list:[
    ],
  },

]