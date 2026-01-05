

import re
import sys
import random
import math
import traceback
import os

import xml.etree.ElementTree as ET

# Imports for GUI
#import tkinter as tk
#import tkinter.ttk as ttk
#from tkinter import font, Menu, messagebox, PhotoImage, Toplevel, Scrollbar, TclError


variables = []
story = []


class Variable:
    def __init__(self):
        self.name = None
        self.value = None
        self.lst = None
        self.money = False

    def to_s(self):
        s = "  {name:'"
        s += self.name
        s += "', value:"
        if type(self.value) == str:
            s += f"'{self.value}'"
        elif type(self.value) == int:
            s += f"{self.value}"
        elif type(self.value) == bool:
            s += 'true' if self.value else 'false'
        else:
            raise Exception("Type not allowed: " + str(type(self.value)))
        if (self.money):
            s += f", money:true"
        if (self.lst):
            s += f", list:['{"', '".join(self.lst) }']"
        s += "},\n"
        return s
        
    def to_js():
        s = "const variables = [\n"
        for el in variables:
            s += el.to_s()
        s += "]\n"
        return s
        
    def get_list_index(self, s):
        for i, el in enumerate(self.lst):
            if el == s:
                return i
   
   
    def from_xml(element):
        v = Variable()
        v.name = element.attrib['name']
        v.v_type = element.attrib['type']
        value = element.find('value').text
        if value == None:
            value = ''
        print(v.name)
        print(value)
        if v.v_type == 'money':
            v.money = True
            v.value = int(value)
        elif v.v_type == 'int':
            v.value = int(value)
        elif v.v_type == 'str':
            v.value = value
        elif v.v_type == 'bool':
            v.value = value == 'true'
        elif v.v_type == 'lst':
            v.lst = []
            for e in element.findall('lst/li'):
                v.lst.append(e.text)
            v.value = v.get_list_index(value)
        else:
            raise Exception("Unexpected type: " + str(v.v_type))
        print(v.to_s())
        global variables
        variables.append(v)
    
    def _to_xml(self):
        s =  '    <v name="' + self.name
        if self.money:
            s += '" type="money">\n'
        elif self.lst:
            s += '" type="list">\n'
        elif type(self.value) == str:
            s += '" type="str">\n'
        elif type(self.value) == int:
            s += '" type="int">\n'
        elif type(self.value) == bool:
            s += '" type="bool">\n'
        else:
            raise Exception("Bad type:" + self.name)
        
        s += '      <value>' + str(self.value) + '</value>\n'
        
        if self.lst:
            s += '      <lst>\n'
            for el in self.lst:
                s += '        <li>' + el + '</li>\n'
            s += '      </lst>\n'
        s += '    </v>\n'
        return s

    def to_xml():
        s = '  <vars>\n'
        for el in variables:
            s += el._to_xml()
        s += '  </vars>\n\n'
        return s
    
    


class Passage:
    atts = ['chapter', 'css', 'passage_type']
    
    def __init__(self, chapter=None):
        self.name = ''
        for att in Passage.atts:
            setattr(self, att, None)
        self.text = ''
        self.title = None
        self.portal = False
        self.links = []
        
    def from_xml(element):
        p = Passage()
        p.name = element.attrib['name']
        p.text = element.find('text').text
        if p.text == None:
            p.text = ''
        for e in element.findall('links/l'):
            Link.from_xml(p, e)
            
        for att in Passage.atts:
            if att in element.attrib:
                setattr(p, att, element.attrib[att])
        p.portal = 'portal' in element.attrib and element.attrib['portal'] == 'true'
        title = element.find('title')
        if title is not None:
            p.title = title.text
            
            
            
        global story
        story.append(p)
    
    def _to_xml(self):
        s =  '    <p name="' + self.name + '"'
        for att in Passage.atts:
            if getattr(self, att):
                s += f' {att}="{getattr(self, att)}"'
        if self.portal:
            s += ' portal="true'
        s += '>\n'
        if self.title:
            s += '      <title>' + self.title + '</title>\n'
        s += '      <text>' + self.text + '</text>\n'
        
        s += '      <links>\n'
        for el in self.links:
            s += el.to_xml()
        s += '      </links>\n'
        s += '    </p>\n'
        return s


    def to_xml():
        s = '  <story>\n'
        for el in story:
            s += el._to_xml()
        s += '  </story>\n'
        return s


        
class Link:
    atts = ['text', 'script', 'and_script', 'or_script']
    
    def __init__(self):
        self.name = None
        for att in Link.atts:
            setattr(self, att, None)
        

    def _to_js(self):
        s = "      {"
        s += f"name:'{self.name}', "
        for att in Link.atts:
            if hasattr(self, att):
                s = f"{att}:'{getattr(self, att)}', "
        s += "},\n"
        return s
        
    
    def to_js(links):
        s = "    choice_list:[\n"
        for el in links:
            s += el._to_js()
        s += "    ]\n"
        return s
        
    def from_xml(passage, element):
        l = Link()
        l.name = element.attrib['name']
        for att in Link.atts:
            el = element.find(att)
            if el is not None:
                print(att)
                setattr(l, att, el.text)
        passage.links.append(l)


    def to_xml(self):
        s = '        <l name="' + self.name + '>\n'
        for att in Link.atts:
            if getattr(self, att):
                s += f"          <{att}>{getattr(self, att)}</{att}\n"
        s += '        </l>\n'
        return s





tree = ET.parse('choices.xml')
xml_root = tree.getroot()
for child in xml_root[0]:
    Variable.from_xml(child)
for child in xml_root[1]:
    Passage.from_xml(child)

#print(Variable.to_xml())
print(Passage.to_xml())



def edit():
    print('Edit')

'''
from tkinter import *
from tkinter import ttk
root = Tk()
frm = ttk.Frame(root, padding=10)
frm.grid()
ttk.Label(frm, text="Hello World!").grid(column=0, row=0)
ttk.Button(frm, text="Edit", command=edit).grid(column=1, row=0)
ttk.Button(frm, text="Quit", command=root.destroy).grid(column=2, row=0)
root.mainloop()
'''


import tkinter as tk

def savePosn(event):
    global lastx, lasty
    lastx, lasty = event.x, event.y

def addLine(event):
    canvas.create_line(lastx, lasty, event.x, event.y)
    savePosn(event)



root = tk.Tk()


root.protocol("WM_DELETE_WINDOW", root.destroy)
root.geometry("600x600")

frame=tk.Frame(root,width=300,height=300)
frame.pack(expand=True, fill=tk.BOTH) #.grid(row=0,column=0)
canvas=tk.Canvas(frame,bg='#FFFFFF',width=300,height=300,scrollregion=(0,0,500,500))
hbar=tk.Scrollbar(frame,orient=tk.HORIZONTAL)
hbar.pack(side=tk.BOTTOM,fill=tk.X)
hbar.config(command=canvas.xview)
vbar=tk.Scrollbar(frame,orient=tk.VERTICAL)
vbar.pack(side=tk.RIGHT,fill=tk.Y)
vbar.config(command=canvas.yview)
canvas.config(width=600,height=600)
canvas.config(xscrollcommand=hbar.set, yscrollcommand=vbar.set)
canvas.pack(side=tk.LEFT,expand=True,fill=tk.BOTH)





# Create circle
circle = canvas.create_oval(10, 10, 60, 60, fill="red")



canvas.bind("<Button-1>", savePosn)
canvas.bind("<B1-Motion>", addLine)


root.mainloop()

print("Great job!")





'''
passage = Passage()
l1 = Link(passage)
l1.name = 'Go to bed'

l2 = Link(passage)
l2.name = 'late'
l2.text = 'Stay up late'



print(Variable.to_js())
s = Variable.to_js()
Variable.from_s(s)
print(Variable.to_js())
'''