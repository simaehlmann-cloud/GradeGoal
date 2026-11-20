# Traegt eine Datei als Ressource in das von Capacitor erzeugte
# Xcode-Projekt ein. Eine Datei nur in den Ordner zu kopieren genuegt
# nicht – Xcode buendelt nur, was im Projekt steht.
#
# Aufruf: ruby tools/apple/add-resource.rb <Dateiname im Ordner ios/App/App>
require "xcodeproj"

name = ARGV[0] or abort("Dateiname fehlt")
project_path = "ios/App/App.xcodeproj"
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == "App" } or abort("Ziel 'App' nicht gefunden")
group = project.main_group.find_subpath("App", false) or abort("Gruppe 'App' nicht gefunden")

ref = group.files.find { |f| f.path == name } || group.new_reference(name)
unless target.resources_build_phase.files_references.include?(ref)
  target.resources_build_phase.add_file_reference(ref)
end
project.save
puts "#{name} ist Ressource im Ziel App."
