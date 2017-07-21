---
layout: post
title: On Mod Content Register Order and the CompletableFuture
---
A particularly annoying aspect of the Minecraft Forge registry event system is that it is difficult to detect when a
block/item/oredict/et cetera is registered without having to write a plethora of scattered, disorganized code. In order to do so,
one is often stuck with writing code in places distanct from closely related code that needs to run at a different time.
Consider a snippet of code that must integrate and add items for a darkwood Tinkers material **after** the item
is registered, but before `FMLInitializationEvent`:
```java
@Mod.EventBusSubscriber(modid = ModInfo.MODID)
class InitMaterial implements IModule {
  public void init() {
    Material darkwood = new Material("darkwood", 0x000099);
    darkwood.addTrait(DarkTraveler.darktraveler);
    // do all the initialization stuff here… except for item adding and integration
    //
    //
    //
    //
    //
    //
    //
  }
  
  @SubscribeEvent(priority = EventPriority.LOWEST)
  public static void onReg(RegistryEvent.Register<Item> event) {
    Material darkwood = findDarkwoodMaterialFromSomeLocalRegistry();
    darkwood.addItem(darkwoodPlanks, 1, Material.VALUE_Ingot);
    // add log and sticks
    //
    doIntegrate(darkwood);
  }
}
```
The main problem with this approach is that some code that is used for initalizing materials is separated from the rest of
the initialization code—it is in an event method, which is separated from the initialization method. This can severely hinder
maintenence, as one has to remember jump to the two areas of code. This quickly gets worse the more of these one has.

Enter the `CompletableFuture`, aka the promise.

Promises (`CompletableFuture`s in Java) give a method to group related code that needs to run at a different time
(asynchronous programming). With them, one has a method to chain and monitor dependencies while keeping code in
a logical grouping. For example, the above code becomes

```java
@Mod.EventBusSubscriber(modid = ModInfo.MODID)
class InitMaterial implements IModule {
  private static final CompletableFuture<?> darkwoodPromise = new CompletableFuture<>();
  
  public void init() {
    Material darkwood = new Material("darkwood", 0x000099);
    darkwood.addTrait(DarkTraveler.darktraveler);
    // do all the initialization stuff here
    //
    //
    CompletableFuture<?> darkwoodPromise1 = darkwoodPromise.thenRun(() -> {
      darkwood.addItem(darkwoodPlanks, 1, Material.VALUE_Ingot);
      // add log and sticks
      //
    });
    //
    //
    //
    //
    //
    queueIntegration(darkwood, darkwoodPromise1);
  }
  
  @SubscribeEvent(priority = EventPriority.LOWEST)
  public static void onReg(RegistryEvent.Register<Item> event) {
    darkwoodPromise.complete(null); // resolves dependency
  }
}
```
As one will notice, all of the initialization code is now organized in a single method, `init()`. Now, one
can continue to attach more initalization that needs darkwood to be registered first, all without modifying
the event handler! Not only that, promises/`CompletableFuture`s can provide a plethora of other code clarity and dependency
management techniques (not just for mods, and *certainly* not just for Java), such as [adding material traits that are registered late](https://github.com/Landmaster/PlusTiC/blob/040526b43f94b8cb6b19021eb0f5aaf99a51e3fb/src/main/java/landmaster/plustic/modules/ModuleTF.java#L40)
(`ModifierRegisterPromise` is a subclass of `CompletableFuture<IModifier>`)! They can even be combined
whenever there are multiple dependencies, using the `thenCombine` instance method, the `CompletableFuture.allOf` static method,
or the `CompletableFuture.*Both` family of instance methods!
