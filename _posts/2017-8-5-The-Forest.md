---
layout: post
title: Missing the Iteration Forest for the Modloading Trees
---
Not long ago, there was a bug in my mod PlusTiC that sometimes erratically disabled the osmiridium material. Thinking that it
was a modloading bug, I wandered aimlessly through the trees to find which mods were loading in a strange order. It wasn’t until
today that I found that I had missed the iteration forest for the modloading trees—the modloading was fine, but I used a `THashSet` to store the modules
when I should have used a `LinkedHashSet` instead! Using the `THashSet` caused great unpredictability in the iteration order
of the modules—sometimes causing the `ModuleMekanism` to load *before* the `ModuleBase`—**which is not what I wanted!**
